// Pathfinding - A* Algorithm implementation
class Pathfinder {
    constructor() {
        // Direction vectors (8 directions including diagonals)
        this.directions = [
            { x: 0, y: -1, cost: 1 },    // Up
            { x: 1, y: 0, cost: 1 },     // Right
            { x: 0, y: 1, cost: 1 },     // Down
            { x: -1, y: 0, cost: 1 },    // Left
            { x: 1, y: -1, cost: 1.414 }, // Up-Right
            { x: 1, y: 1, cost: 1.414 },  // Down-Right
            { x: -1, y: 1, cost: 1.414 }, // Down-Left
            { x: -1, y: -1, cost: 1.414 } // Up-Left
        ];
    }

    // Find path from start to goal
    findPath(startX, startY, goalX, goalY, dungeon, maxIterations = 1000) {
        // Round coordinates
        startX = Math.floor(startX);
        startY = Math.floor(startY);
        goalX = Math.floor(goalX);
        goalY = Math.floor(goalY);

        // Check if goal is walkable
        const goalTile = dungeon.getTile(goalX, goalY);
        if (!goalTile || goalTile.blocksMovement) {
            // Try to find nearest walkable tile to goal
            const nearest = this.findNearestWalkable(goalX, goalY, dungeon);
            if (nearest) {
                goalX = nearest.x;
                goalY = nearest.y;
            } else {
                return null;
            }
        }

        // A* algorithm
        const openSet = new MinHeap();
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const startKey = `${startX},${startY}`;
        const goalKey = `${goalX},${goalY}`;

        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(startX, startY, goalX, goalY));
        openSet.insert({ x: startX, y: startY, f: fScore.get(startKey) });

        let iterations = 0;

        while (!openSet.isEmpty() && iterations < maxIterations) {
            iterations++;

            const current = openSet.extractMin();
            const currentKey = `${current.x},${current.y}`;

            // Goal reached
            if (current.x === goalX && current.y === goalY) {
                return this.reconstructPath(cameFrom, current);
            }

            closedSet.add(currentKey);

            // Check all neighbors
            for (const dir of this.directions) {
                const neighborX = current.x + dir.x;
                const neighborY = current.y + dir.y;
                const neighborKey = `${neighborX},${neighborY}`;

                // Skip if already evaluated
                if (closedSet.has(neighborKey)) continue;

                // Check if walkable
                const tile = dungeon.getTile(neighborX, neighborY);
                if (!tile || tile.blocksMovement) continue;

                // For diagonal movement, check if we can actually move diagonally
                if (dir.x !== 0 && dir.y !== 0) {
                    const tile1 = dungeon.getTile(current.x + dir.x, current.y);
                    const tile2 = dungeon.getTile(current.x, current.y + dir.y);
                    if ((tile1 && tile1.blocksMovement) || (tile2 && tile2.blocksMovement)) {
                        continue; // Can't cut corners
                    }
                }

                // Calculate tentative g score
                const tentativeG = gScore.get(currentKey) + dir.cost;

                if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
                    // This path is better
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeG);
                    const f = tentativeG + this.heuristic(neighborX, neighborY, goalX, goalY);
                    fScore.set(neighborKey, f);

                    // Add to open set if not already there
                    if (!openSet.contains(neighborKey)) {
                        openSet.insert({ x: neighborX, y: neighborY, f: f });
                    }
                }
            }
        }

        // No path found
        return null;
    }

    // Heuristic function (diagonal distance)
    heuristic(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        // Diagonal distance heuristic
        return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
    }

    // Reconstruct path from goal to start
    reconstructPath(cameFrom, current) {
        const path = [{ x: current.x, y: current.y }];
        let currentKey = `${current.x},${current.y}`;

        while (cameFrom.has(currentKey)) {
            const prev = cameFrom.get(currentKey);
            path.unshift({ x: prev.x, y: prev.y });
            currentKey = `${prev.x},${prev.y}`;
        }

        // Remove starting position from path
        if (path.length > 1) {
            path.shift();
        }

        return path;
    }

    // Find nearest walkable tile to a blocked position
    findNearestWalkable(x, y, dungeon, maxRadius = 5) {
        for (let r = 1; r <= maxRadius; r++) {
            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) {
                    if (Math.abs(dx) === r || Math.abs(dy) === r) {
                        const tile = dungeon.getTile(x + dx, y + dy);
                        if (tile && !tile.blocksMovement) {
                            return { x: x + dx, y: y + dy };
                        }
                    }
                }
            }
        }
        return null;
    }

    // Simple line-of-sight movement check (for direct paths)
    hasDirectPath(x1, y1, x2, y2, dungeon) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;

        let x = Math.floor(x1);
        let y = Math.floor(y1);
        const endX = Math.floor(x2);
        const endY = Math.floor(y2);

        while (true) {
            const tile = dungeon.getTile(x, y);
            if (!tile || tile.blocksMovement) {
                return false;
            }

            if (x === endX && y === endY) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }

        return true;
    }
}

// Min-Heap for efficient priority queue
class MinHeap {
    constructor() {
        this.heap = [];
        this.positions = new Map(); // Track positions of elements
    }

    insert(node) {
        const key = `${node.x},${node.y}`;
        this.heap.push(node);
        this.positions.set(key, this.heap.length - 1);
        this.bubbleUp(this.heap.length - 1);
    }

    extractMin() {
        if (this.heap.length === 0) return null;

        const min = this.heap[0];
        const key = `${min.x},${min.y}`;
        this.positions.delete(key);

        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.positions.set(`${last.x},${last.y}`, 0);
            this.sinkDown(0);
        }

        return min;
    }

    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[parentIndex].f <= this.heap[index].f) break;

            this.swap(index, parentIndex);
            index = parentIndex;
        }
    }

    sinkDown(index) {
        const length = this.heap.length;
        while (true) {
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            let smallest = index;

            if (leftChild < length && this.heap[leftChild].f < this.heap[smallest].f) {
                smallest = leftChild;
            }
            if (rightChild < length && this.heap[rightChild].f < this.heap[smallest].f) {
                smallest = rightChild;
            }

            if (smallest === index) break;

            this.swap(index, smallest);
            index = smallest;
        }
    }

    swap(i, j) {
        const keyI = `${this.heap[i].x},${this.heap[i].y}`;
        const keyJ = `${this.heap[j].x},${this.heap[j].y}`;

        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];

        this.positions.set(keyI, j);
        this.positions.set(keyJ, i);
    }

    contains(key) {
        return this.positions.has(key);
    }

    isEmpty() {
        return this.heap.length === 0;
    }
}
