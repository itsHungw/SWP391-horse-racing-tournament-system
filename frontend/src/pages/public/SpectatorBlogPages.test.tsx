import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { blogApi } from "../../api/blogApi";
import { getPublicRacingSummary, searchPublicRaces } from "../../api/racingApi";
import type { Blog, PageResponse } from "../../types/blog";
import type { PageResponse as RacingPageResponse, RaceSummary } from "../../types/racing";
import { HomePage } from "./HomePage";
import { SpectatorBlogDetailPage } from "./SpectatorBlogDetailPage";
import { SpectatorBlogListPage } from "./SpectatorBlogListPage";

vi.mock("../../api/blogApi", () => ({
  blogApi: {
    getPublishedBlogs: vi.fn(),
    getPublishedBlogBySlug: vi.fn(),
    claimBlogReward: vi.fn(),
  },
}));

vi.mock("../../api/racingApi", () => ({
  getPublicRacingSummary: vi.fn(),
  searchPublicRaces: vi.fn(),
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
    expect(searchPublicRaces).toHaveBeenCalledWith({
      scope: "UPCOMING",
      sortBy: "NEXT_RACE",
      page: 0,
      size: 3,
    });
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

  it("shows reward progress and gates the claim button until eligible", async () => {
    vi.useFakeTimers();
    vi.mocked(blogApi.getPublishedBlogBySlug).mockResolvedValue(blog);

    render(
      <MemoryRouter initialEntries={[`/blogs/${blog.slug}`]}>
        <Routes>
          <Route path="/blogs/:slug" element={<SpectatorBlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText(/reading time/i)).toBeInTheDocument();
    expect(screen.getByText(/scroll progress/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /claim reward/i })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    Object.defineProperty(window, "scrollY", { value: 800, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 200, configurable: true });
    Object.defineProperty(document.documentElement, "scrollHeight", { value: 1_000, configurable: true });
    act(() => {
      fireEvent.scroll(window);
    });

    expect(screen.getByRole("button", { name: /claim reward/i })).toBeEnabled();
  });

  it("shows and submits the blog reward claim after reading and scrolling enough", async () => {
    vi.useFakeTimers();
    vi.mocked(blogApi.getPublishedBlogBySlug).mockResolvedValue(blog);
    vi.mocked(blogApi.claimBlogReward).mockResolvedValue({
      outcome: "CLAIMED",
      pointsAwarded: 10,
      balance: 25,
    });

    render(
      <MemoryRouter initialEntries={[`/blogs/${blog.slug}`]}>
        <Routes>
          <Route path="/blogs/:slug" element={<SpectatorBlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: blog.title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /claim reward/i })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    Object.defineProperty(window, "scrollY", { value: 800, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 200, configurable: true });
    Object.defineProperty(document.documentElement, "scrollHeight", { value: 1_000, configurable: true });
    act(() => {
      fireEvent.scroll(window);
    });

    const claimButton = screen.getByRole("button", { name: /claim reward/i });
    await act(async () => {
      fireEvent.click(claimButton);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(blogApi.claimBlogReward).toHaveBeenCalledWith(blog.slug, {
      readingSeconds: 30,
      scrollPercent: 100,
    });
    expect(screen.getByText("You earned 10 virtual points.")).toBeInTheDocument();
  });

  it("shows already claimed and daily limit reward responses", async () => {
    vi.useFakeTimers();
    vi.mocked(blogApi.getPublishedBlogBySlug).mockResolvedValue(blog);
    vi.mocked(blogApi.claimBlogReward)
      .mockResolvedValueOnce({ outcome: "ALREADY_CLAIMED", pointsAwarded: 0, balance: 15 })
      .mockResolvedValueOnce({ outcome: "DAILY_LIMIT_REACHED", pointsAwarded: 0, balance: 15 });

    render(
      <MemoryRouter initialEntries={[`/blogs/${blog.slug}`]}>
        <Routes>
          <Route path="/blogs/:slug" element={<SpectatorBlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: blog.title })).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    Object.defineProperty(window, "scrollY", { value: 800, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 200, configurable: true });
    Object.defineProperty(document.documentElement, "scrollHeight", { value: 1_000, configurable: true });
    act(() => {
      fireEvent.scroll(window);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /claim reward/i }));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText("Reward already claimed.")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /claim reward/i }));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText("Daily reward limit reached.")).toBeInTheDocument();
  });
});
