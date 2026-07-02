package com.example.horseracingtournamentsystem.race.repository;

import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public class RacePublicSearchRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public Page<Race> search(
            String scope,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Long tournamentId,
            String search,
            String horse,
            String jockey,
            String sortBy,
            Pageable pageable
    ) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Race> contentQuery = cb.createQuery(Race.class);
        Root<Race> race = contentQuery.from(Race.class);
        race.fetch("tournament", JoinType.INNER);
        Join<Race, Tournament> tournament = race.join("tournament", JoinType.INNER);

        contentQuery.select(race)
                .where(predicates(cb, contentQuery, race, tournament, scope, fromDate, toDate, tournamentId, search, horse, jockey))
                .orderBy(orderBy(cb, race, sortBy));

        TypedQuery<Race> typedQuery = entityManager.createQuery(contentQuery);
        typedQuery.setFirstResult(Math.toIntExact(pageable.getOffset()));
        typedQuery.setMaxResults(pageable.getPageSize());
        List<Race> content = typedQuery.getResultList();

        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Race> countRace = countQuery.from(Race.class);
        Join<Race, Tournament> countTournament = countRace.join("tournament", JoinType.INNER);
        countQuery.select(cb.count(countRace))
                .where(predicates(cb, countQuery, countRace, countTournament, scope, fromDate, toDate, tournamentId, search, horse, jockey));
        Long total = entityManager.createQuery(countQuery).getSingleResult();

        return new PageImpl<>(content, pageable, total);
    }

    private Predicate[] predicates(
            CriteriaBuilder cb,
            CriteriaQuery<?> query,
            Root<Race> race,
            Join<Race, Tournament> tournament,
            String scope,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Long tournamentId,
            String search,
            String horse,
            String jockey
    ) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.isNull(race.get("deletedAt")));
        predicates.add(race.get("status").in(statusesForScope(scope)));

        // Build nullable filters dynamically; PostgreSQL cannot type a bare "? is null" timestamp parameter.
        if (fromDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(race.get("raceAt"), fromDate));
        }
        if (toDate != null) {
            predicates.add(cb.lessThanOrEqualTo(race.get("raceAt"), toDate));
        }
        if (tournamentId != null) {
            predicates.add(cb.equal(tournament.get("id"), tournamentId));
        }

        if (hasText(search)) {
            String pattern = likePattern(search);
            predicates.add(cb.or(
                    cb.like(cb.lower(race.get("name")), pattern),
                    cb.like(cb.lower(race.get("code")), pattern),
                    cb.like(cb.lower(tournament.get("name")), pattern),
                    cb.like(cb.lower(tournament.get("location")), pattern)
            ));
        }
        if (hasText(horse)) {
            predicates.add(horseMatches(cb, query, race, horse));
        }
        if (hasText(jockey)) {
            predicates.add(jockeyMatches(cb, query, race, jockey));
        }

        return predicates.toArray(Predicate[]::new);
    }

    private List<Order> orderBy(CriteriaBuilder cb, Root<Race> race, String sortBy) {
        if ("LATEST_RESULT".equals(sortBy)) {
            return List.of(cb.desc(race.get("raceAt")), cb.asc(race.get("id")));
        }
        return List.of(cb.asc(race.get("raceAt")), cb.asc(race.get("id")));
    }

    private List<RaceStatus> statusesForScope(String scope) {
        if ("RESULTS".equals(scope)) {
            return List.of(
                    RaceStatus.FINISHED,
                    RaceStatus.RESULT_SUBMITTED,
                    RaceStatus.RESULT_CONFIRMED,
                    RaceStatus.PUBLISHED
            );
        }
        return List.of(
                RaceStatus.SCHEDULED,
                RaceStatus.CHECKING,
                RaceStatus.READY,
                RaceStatus.ONGOING
        );
    }

    private Predicate horseMatches(CriteriaBuilder cb, CriteriaQuery<?> query, Root<Race> race, String horse) {
        Subquery<Long> subquery = query.subquery(Long.class);
        Root<RaceParticipant> participant = subquery.from(RaceParticipant.class);
        Join<RaceParticipant, Horse> horseJoin = participant.join("horse", JoinType.INNER);
        subquery.select(participant.get("id"))
                .where(
                        cb.equal(participant.get("race").get("id"), race.get("id")),
                        cb.like(cb.lower(horseJoin.get("name")), likePattern(horse))
                );
        return cb.exists(subquery);
    }

    private Predicate jockeyMatches(CriteriaBuilder cb, CriteriaQuery<?> query, Root<Race> race, String jockey) {
        Subquery<Long> subquery = query.subquery(Long.class);
        Root<RaceParticipant> participant = subquery.from(RaceParticipant.class);
        Join<RaceParticipant, User> jockeyJoin = participant.join("jockey", JoinType.INNER);
        subquery.select(participant.get("id"))
                .where(
                        cb.equal(participant.get("race").get("id"), race.get("id")),
                        cb.like(cb.lower(jockeyJoin.get("fullName")), likePattern(jockey))
                );
        return cb.exists(subquery);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String likePattern(String value) {
        return "%" + value.trim().toLowerCase(Locale.ROOT) + "%";
    }
}
