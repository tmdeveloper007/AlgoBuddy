# Issue Candidates

1. Title: test : add unit tests for BFS generator logic in src/features/algorithms/graph/bfsLogic.js
   Type: test
   Files: src/features/algorithms/graph/bfsLogic.js, security-tests/bfsLogic.test.cjs
   Summary: The BFS generator function in bfsLogic.js produces step-by-step visualization frames for graph traversal but has no unit test coverage. Tests should verify it yields the correct frame sequence for a simple graph and handles edge cases.
   Verification: node --experimental-detect-module --test security-tests/bfsLogic.test.cjs
   Conflict risk: low

2. Title: test : add unit tests for DFS generator logic in src/features/algorithms/graph/dfsLogic.js
   Type: test
   Files: src/features/algorithms/graph/dfsLogic.js, security-tests/dfsLogic.test.cjs
   Summary: The DFS generator function in dfsLogic.js produces step-by-step visualization frames with backtracking for graph traversal but has no unit test coverage. Tests should verify correct backtracking behavior, visited node accumulation, and edge cases.
   Verification: node --experimental-detect-module --test security-tests/dfsLogic.test.cjs
   Conflict risk: low

3. Title: test : add unit tests for A* search generator logic in src/features/algorithms/graph/aStarLogic.js
   Type: test
   Files: src/features/algorithms/graph/aStarLogic.js, security-tests/aStarLogic.test.cjs
   Summary: The A* search generator in aStarLogic.js produces visualization frames for heuristic pathfinding but has no unit test coverage. Tests should verify null handling, initialization frames, found/no_path phases, and disconnected graphs.
   Verification: node --experimental-detect-module --test security-tests/aStarLogic.test.cjs
   Conflict risk: low

4. Title: test : add security tests for Arena socket BoundedMap and CORS origin validation
   Type: test
   Files: arena-socket-server/index.js, security-tests/arenaSocket.test.cjs
   Summary: The BoundedMap LRU cache class and isAllowedVercelOrigin CORS validation function are critical security components in arena-socket-server/index.js with no test coverage. Tests should verify LRU eviction behavior, capacity limits, and strict origin matching.
   Verification: node --experimental-detect-module --test security-tests/arenaSocket.test.cjs
   Conflict risk: low

5. Title: test : add security tests for visualizer sections data structure in src/lib/visualizerSections.js
   Type: test
   Files: src/lib/visualizerSections.js, security-tests/visualizerSections.test.cjs
   Summary: The sections data exported from visualizerSections.js defines all algorithm visualizer navigation paths. Tests should validate required fields, no duplicate slugs/paths, and presence of key sections like AI algorithms, Graph traversal, and Recursion topics.
   Verification: node --experimental-detect-module --test security-tests/visualizerSections.test.cjs
   Conflict risk: low
