package com.algobuddy.backend.service;

import com.algobuddy.backend.dto.LeaderboardEntryDto;
import com.algobuddy.backend.repository.UserArenaProfileRepository;
import com.algobuddy.backend.repository.UserPracticeStatsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class LeaderboardServiceUnitTest {

    private UserPracticeStatsRepository statsRepository;
    private UserArenaProfileRepository arenaRepository;
    private LeaderboardService leaderboardService;

    @BeforeEach
    public void setUp() {
        statsRepository = mock(UserPracticeStatsRepository.class);
        arenaRepository = mock(UserArenaProfileRepository.class);
        leaderboardService = new LeaderboardService(statsRepository, arenaRepository);
    }

    @Test
    public void testGetGlobalStreakLeaderboardReturnsEntriesWithCorrectRanks() {
        // Arrange: create a mutable list of entries from the repository
        List<LeaderboardEntryDto> repoEntries = new ArrayList<>();
        repoEntries.add(LeaderboardEntryDto.builder()
                .rank(0)
                .userId(UUID.randomUUID())
                .username("alice")
                .score(30)
                .build());
        repoEntries.add(LeaderboardEntryDto.builder()
                .rank(0)
                .userId(UUID.randomUUID())
                .username("bob")
                .score(20)
                .build());
        repoEntries.add(LeaderboardEntryDto.builder()
                .rank(0)
                .userId(UUID.randomUUID())
                .username("carol")
                .score(10)
                .build());

        when(statsRepository.findTop100StreakLeaderboard(any())).thenReturn(repoEntries);

        // Act
        List<LeaderboardEntryDto> result = leaderboardService.getGlobalStreakLeaderboard();

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals(1, result.get(0).getRank());
        assertEquals(2, result.get(1).getRank());
        assertEquals(3, result.get(2).getRank());
        assertEquals("alice", result.get(0).getUsername());
        assertEquals("bob", result.get(1).getUsername());
        assertEquals("carol", result.get(2).getUsername());
        verify(statsRepository, times(1)).findTop100StreakLeaderboard(any());
        verify(arenaRepository, never()).findTop100ArenaLeaderboard(any());
    }

    @Test
    public void testGetGlobalStreakLeaderboardReturnsEmptyListWhenNoData() {
        when(statsRepository.findTop100StreakLeaderboard(any())).thenReturn(Collections.emptyList());

        List<LeaderboardEntryDto> result = leaderboardService.getGlobalStreakLeaderboard();

        assertNotNull(result);
        assertEquals(0, result.size());
        verify(statsRepository, times(1)).findTop100StreakLeaderboard(any());
    }

    @Test
    public void testGetGlobalArenaLeaderboardReturnsEntriesWithCorrectRanks() {
        List<LeaderboardEntryDto> repoEntries = new ArrayList<>();
        repoEntries.add(LeaderboardEntryDto.builder()
                .rank(0)
                .userId(UUID.randomUUID())
                .username("pro")
                .score(2000)
                .build());
        repoEntries.add(LeaderboardEntryDto.builder()
                .rank(0)
                .userId(UUID.randomUUID())
                .username("amateur")
                .score(1500)
                .build());

        when(arenaRepository.findTop100ArenaLeaderboard(any())).thenReturn(repoEntries);

        List<LeaderboardEntryDto> result = leaderboardService.getGlobalArenaLeaderboard();

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1, result.get(0).getRank());
        assertEquals(2, result.get(1).getRank());
        assertEquals("pro", result.get(0).getUsername());
        assertEquals("amateur", result.get(1).getUsername());
        verify(arenaRepository, times(1)).findTop100ArenaLeaderboard(any());
        verify(statsRepository, never()).findTop100StreakLeaderboard(any());
    }

    @Test
    public void testGetGlobalArenaLeaderboardReturnsEmptyListWhenNoData() {
        when(arenaRepository.findTop100ArenaLeaderboard(any())).thenReturn(Collections.emptyList());

        List<LeaderboardEntryDto> result = leaderboardService.getGlobalArenaLeaderboard();

        assertNotNull(result);
        assertEquals(0, result.size());
        verify(arenaRepository, times(1)).findTop100ArenaLeaderboard(any());
    }

    @Test
    public void testRanksAreOneIndexedStartingFromOne() {
        List<LeaderboardEntryDto> repoEntries = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            repoEntries.add(LeaderboardEntryDto.builder()
                    .rank(0)
                    .userId(UUID.randomUUID())
                    .username("user" + i)
                    .score(100 - i)
                    .build());
        }

        when(statsRepository.findTop100StreakLeaderboard(any())).thenReturn(repoEntries);

        List<LeaderboardEntryDto> result = leaderboardService.getGlobalStreakLeaderboard();

        assertEquals(5, result.size());
        for (int i = 0; i < 5; i++) {
            assertEquals(i + 1, result.get(i).getRank(),
                    "Rank at index " + i + " should be " + (i + 1));
        }
    }

    @Test
    public void testStreakAndArenaLeaderboardsAreIndependent() {
        // Verify that calling one does not affect the other
        List<LeaderboardEntryDto> streakEntries = new ArrayList<>();
        streakEntries.add(LeaderboardEntryDto.builder()
                .rank(0)
                .userId(UUID.randomUUID())
                .username("streaker")
                .score(50)
                .build());
        when(statsRepository.findTop100StreakLeaderboard(any())).thenReturn(streakEntries);

        List<LeaderboardEntryDto> arenaEntries = new ArrayList<>();
        arenaEntries.add(LeaderboardEntryDto.builder()
                .rank(0)
                .userId(UUID.randomUUID())
                .username("arena_star")
                .score(3000)
                .build());
        when(arenaRepository.findTop100ArenaLeaderboard(any())).thenReturn(arenaEntries);

        List<LeaderboardEntryDto> streakResult = leaderboardService.getGlobalStreakLeaderboard();
        List<LeaderboardEntryDto> arenaResult = leaderboardService.getGlobalArenaLeaderboard();

        assertEquals(1, streakResult.size());
        assertEquals("streaker", streakResult.get(0).getUsername());

        assertEquals(1, arenaResult.size());
        assertEquals("arena_star", arenaResult.get(0).getUsername());

        // Each repository should be called exactly once
        verify(statsRepository, times(1)).findTop100StreakLeaderboard(any());
        verify(arenaRepository, times(1)).findTop100ArenaLeaderboard(any());
    }
}
