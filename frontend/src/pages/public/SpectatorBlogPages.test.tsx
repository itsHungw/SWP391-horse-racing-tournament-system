import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { blogApi } from "../../api/blogApi";
import { getPublicRaceHighlights } from "../../api/raceMediaApi";
import { getPublicRaceResults, getPublicRacingSummary, searchPublicRaces } from "../../api/racingApi";
import { clearPublicQueryCache } from "../../hooks/usePublicQuery";
import type { Blog, PageResponse } from "../../types/blog";
import type { PageResponse as RacingPageResponse, RaceSummary } from "../../types/racing";
import { HomePage } from "./HomePage";
import { SpectatorBlogDetailPage } from "./SpectatorBlogDetailPage";
import { SpectatorBlogListPage } from "./SpectatorBlogListPage";

vi.mock("../../api/blogApi", () => ({
  blogApi: {
    getPublishedBlogs: vi.fn(),
    getPublishedBlogBySlug: vi.fn(),
  },
}));

vi.mock("../../api/racingApi", () => ({
  getPublicRaceResults: vi.fn(),
  getPublicRacingSummary: vi.fn(),
  searchPublicRaces: vi.fn(),
}));

vi.mock("../../api/raceMediaApi", () => ({
  getPublicRaceHighlights: vi.fn(),
}));

const blog: Blog = {
  id: 11,
  title: "Derby weekend track notes",
  slug: "derby-weekend-track-notes",
  summary: "How weather and late scratches shape this weekend.",
  content: "<p>Final track notes for spectators.</p>",
  thumbnail: "/api/v1/files/download/track.jpg",
  status: "PUBLISHED",
  authorId: 2,
  authorName: "Race Desk",
  createdAt: "2026-05-29T10:00:00",
  updatedAt: null,
};

const featuredRace: RaceSummary = {
  id: 22,
  tournamentId: 4,
  tournamentName: "Spring Glory Stakes",
  name: "Twilight Sprint",
  code: "TWS-01",
  raceDateTime: "2099-06-13T16:30:00",
  distanceMeters: 1200,
  maxParticipants: 8,
  participantCount: 6,
  status: "SCHEDULED",
  location: "Aqueduct",
  predictionOpen: true,
  predictionCloseTime: "2099-06-13T16:30:00",
  resultOfficial: false,
};

function page(content: Blog[]): PageResponse<Blog> {
  return {
    content,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0,
    size: 9,
    number: 0,
  };
}

function racePage(content: RaceSummary[]): RacingPageResponse<RaceSummary> {
  return {
    content,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0,
    size: 20,
    number: 0,
  };
}

describe("public blog pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // HomePage giờ đọc khối featured qua usePublicQuery (cache 60s theo key). Không
    // xoá thì test sau ăn dữ liệu cached của test trước và không gọi API lần nào.
    clearPublicQueryCache();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(searchPublicRaces).mockImplementation(async (params) =>
      racePage(params.scope === "RESULTS" ? [] : [featuredRace]),
    );
    vi.mocked(getPublicRacingSummary).mockResolvedValue({
      raceCount: 1,
      raceDayCount: 1,
      championshipCount: 1,
      seasonFinale: "2099-06-30",
    });
    vi.mocked(getPublicRaceHighlights).mockResolvedValue([]);
    vi.mocked(getPublicRaceResults).mockResolvedValue({ raceId: 0, official: false, entries: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("loads the latest published blog posts on the home page", async () => {
    vi.mocked(blogApi.getPublishedBlogs).mockResolvedValue(page([blog]));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(blogApi.getPublishedBlogs).toHaveBeenCalledWith(undefined, 0, 3);
    expect(await screen.findByRole("heading", { name: blog.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /all stories/i })).toHaveAttribute("href", "/blogs");
    expect(screen.getByRole("link", { name: /read derby weekend track notes/i })).toHaveAttribute(
      "href",
      `/blogs/${blog.slug}`,
    );
  });

  it("shows the next real race as the featured home card", async () => {
    vi.mocked(blogApi.getPublishedBlogs).mockResolvedValue(page([]));
    vi.mocked(searchPublicRaces).mockImplementation(async (params) =>
      racePage(params.scope === "RESULTS" ? [] : [featuredRace]),
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Twilight Sprint" })).toBeInTheDocument();
    expect(screen.getByText("Spring Glory Stakes")).toBeInTheDocument();
    expect(screen.getByText("1,200 m")).toBeInTheDocument();
    expect(screen.getByText("8 max")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open twilight sprint race card/i })).toHaveAttribute(
      "href",
      "/races/22",
    );
    expect(screen.queryByText(/aqueduct gold cup/i)).not.toBeInTheDocument();
    expect(searchPublicRaces).toHaveBeenCalledWith(expect.objectContaining({
      scope: "UPCOMING",
      sortBy: "NEXT_RACE",
      page: 0,
      size: 3,
    }));
  });

  it("prioritizes the latest published race replay over an upcoming race", async () => {
    const latestResult: RaceSummary = {
      ...featuredRace,
      id: 31,
      name: "Royal Ascendancy Cup — Race 6",
      code: "RAC-06",
      raceDateTime: "2026-07-25T16:00:00",
      status: "PUBLISHED",
      predictionOpen: false,
      predictionCloseTime: "2026-07-25T16:00:00",
      resultOfficial: true,
      winner: { horseName: "Northern Light", jockeyName: "Maya Chen", finishTimeSeconds: 98.21 },
    };
    vi.mocked(blogApi.getPublishedBlogs).mockResolvedValue(page([]));
    vi.mocked(searchPublicRaces).mockImplementation(async (params) =>
      racePage(params.scope === "RESULTS" ? [latestResult] : [featuredRace]),
    );
    vi.mocked(getPublicRaceHighlights).mockResolvedValue([{
      raceId: latestResult.id,
      provider: "YOUTUBE",
      providerVideoId: "M7lc1UVf-VE",
      embedUrl: "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE",
      title: "Race 6 official highlight",
      thumbnailUrl: "https://img.youtube.com/vi/M7lc1UVf-VE/maxresdefault.jpg",
    }]);
    vi.mocked(getPublicRaceResults).mockResolvedValue({
      raceId: latestResult.id,
      official: true,
      entries: [{
        raceParticipantId: 44,
        startNumber: 7,
        laneNumber: 4,
        position: 1,
        horseName: "Northern Light",
        jockeyName: "Maya Chen",
        finishTimeSeconds: 98.21,
        penaltySeconds: 0,
        points: 25,
        resultStatus: "FINISHED",
      }],
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Latest Race Replay")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: latestResult.name })).toBeInTheDocument();
    expect(screen.getByText("Official winner")).toBeInTheDocument();
    expect(screen.getByText("Northern Light")).toBeInTheDocument();
    expect(screen.getByText("Draw 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play highlight: race 6 official highlight/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view official result/i })).toHaveAttribute("href", "/races/31");
    expect(
      screen.getByText("Latest Race Replay").compareDocumentPosition(screen.getByText("The Season"))
      & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("prioritizes an active race over a future scheduled race", async () => {
    vi.mocked(blogApi.getPublishedBlogs).mockResolvedValue(page([]));
    vi.mocked(searchPublicRaces).mockImplementation(async (params) =>
      racePage(params.scope === "RESULTS" ? [] : [
        featuredRace,
        {
        ...featuredRace,
        id: 23,
        name: "Live Championship Run",
        code: "LIVE-01",
        raceDateTime: "2026-06-12T16:30:00",
        status: "ONGOING",
        },
      ]),
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Live Championship Run" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open live championship run race card/i })).toHaveAttribute(
      "href",
      "/races/23",
    );
  });

  it("builds the home statistics from public race and championship data", async () => {
    vi.mocked(blogApi.getPublishedBlogs).mockResolvedValue(page([]));
    vi.mocked(getPublicRacingSummary).mockResolvedValue({
      raceCount: 3,
      raceDayCount: 2,
      championshipCount: 2,
      seasonFinale: "2099-11-15",
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Races on Calendar")).toBeInTheDocument();
    expect(screen.getByText("Race Days")).toBeInTheDocument();
    expect(screen.getAllByText("Championships").length).toBeGreaterThan(0);
    expect(screen.getByText("Season Finale")).toBeInTheDocument();
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getByText("Nov 15")).toBeInTheDocument();
    expect(screen.queryByText("Race Days / Week")).not.toBeInTheDocument();
    expect(screen.queryByText("Free Predictions")).not.toBeInTheDocument();
  });

  it("loads, searches, and links published blog posts on the blog list page", async () => {
    vi.mocked(blogApi.getPublishedBlogs).mockResolvedValue(page([blog]));

    render(
      <MemoryRouter>
        <SpectatorBlogListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("banner")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: blog.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /read derby weekend track notes/i })).toHaveAttribute(
      "href",
      `/blogs/${blog.slug}`,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: /search stories/i }), {
      target: { value: "derby" },
    });

    await waitFor(() => {
      expect(blogApi.getPublishedBlogs).toHaveBeenLastCalledWith("derby");
    });
  });

  it("shows an empty state when there are no published blog posts", async () => {
    vi.mocked(blogApi.getPublishedBlogs).mockResolvedValue(page([]));

    render(
      <MemoryRouter>
        <SpectatorBlogListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/newsroom opens with the season/i)).toBeInTheDocument();
  });

  it("shows an error state when the public blog list cannot load", async () => {
    vi.mocked(blogApi.getPublishedBlogs).mockRejectedValue(new Error("API offline"));

    render(
      <MemoryRouter>
        <SpectatorBlogListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/could not load published stories/i)).toBeInTheDocument();
  });

  it("renders a published blog article by slug", async () => {
    vi.mocked(blogApi.getPublishedBlogBySlug).mockResolvedValue(blog);

    render(
      <MemoryRouter initialEntries={[`/blogs/${blog.slug}`]}>
        <Routes>
          <Route path="/blogs/:slug" element={<SpectatorBlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(blogApi.getPublishedBlogBySlug).toHaveBeenCalledWith(blog.slug);
    expect(await screen.findByRole("banner")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: blog.title })).toBeInTheDocument();
    expect(screen.getByText(/final track notes for spectators/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /back to newsroom/i })[0]).toHaveAttribute("href", "/blogs");
  });
});
