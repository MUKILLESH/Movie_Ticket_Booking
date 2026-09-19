/**
 * Finds the best contiguous block of available seats.
 * 
 * @param {Array} seats - Array of seat objects { SeatID, SeatNumber, SeatType, Price, Status }
 * @param {number} requestedSize - Number of seats requested
 * @param {string} [preferredType] - Optional preferred seat type (e.g., 'PREMIUM')
 * @returns {Array|null} - Best block of seats or null if no contiguous block found
 * 
 * Time Complexity: O(N) where N is the number of seats. 
 * We group seats in O(N), sort rows in O(N log K) (where K is seats per row, very small),
 * and find sequences in O(N).
 */
function findBestContiguousSeats(seats, requestedSize, preferredType = null) {
    if (requestedSize <= 0) return [];
    if (!seats || seats.length === 0) return null;

    // 1. Group seats by row
    // Assuming SeatNumber format is "A1", "A2", "B1" etc.
    const rowGroups = {};
    for (const seat of seats) {
        const rowChar = seat.SeatNumber.match(/^[A-Za-z]+/)[0];
        const num = parseInt(seat.SeatNumber.match(/\d+$/)[0], 10);
        
        if (!rowGroups[rowChar]) {
            rowGroups[rowChar] = [];
        }
        // Enhance seat object for sorting and distance calculation
        rowGroups[rowChar].push({
            ...seat,
            row: rowChar,
            num: num
        });
    }

    const candidateBlocks = [];

    // 2. Sort seats in each row and find contiguous blocks
    for (const row of Object.keys(rowGroups)) {
        const rowSeats = rowGroups[row].sort((a, b) => a.num - b.num);
        
        let currentSequence = [];

        for (let i = 0; i < rowSeats.length; i++) {
            const seat = rowSeats[i];
            
            if (seat.Status === 'AVAILABLE') {
                // If sequence is empty, or the seat is adjacent to the last one
                if (currentSequence.length === 0 || 
                    seat.num === currentSequence[currentSequence.length - 1].num + 1) {
                    currentSequence.push(seat);
                } else {
                    // Gap found, process existing sequence
                    if (currentSequence.length >= requestedSize) {
                        extractSubBlocks(currentSequence, requestedSize, candidateBlocks, rowSeats.length);
                    }
                    currentSequence = [seat];
                }
            } else {
                // Booked seat, process sequence and reset
                if (currentSequence.length >= requestedSize) {
                    extractSubBlocks(currentSequence, requestedSize, candidateBlocks, rowSeats.length);
                }
                currentSequence = [];
            }
        }
        // End of row
        if (currentSequence.length >= requestedSize) {
            extractSubBlocks(currentSequence, requestedSize, candidateBlocks, rowSeats.length);
        }
    }

    if (candidateBlocks.length === 0) {
        return null;
    }

    // 3. Score blocks
    // Lower score is better
    candidateBlocks.forEach(block => {
        let score = 0;

        // Primary: Distance from center of the row
        // A block's center should ideally align with the row's center
        const rowLength = block.rowLength;
        const centerOfRow = rowLength / 2;
        
        const blockStart = block.seats[0].num;
        const blockEnd = block.seats[block.seats.length - 1].num;
        const blockCenter = (blockStart + blockEnd) / 2;

        const distanceToCenter = Math.abs(centerOfRow - blockCenter);
        score += distanceToCenter * 10;

        // Tertiary: Preferred type
        if (preferredType) {
            // If block type doesn't match preferred type, penalize heavily
            if (block.seats[0].SeatType !== preferredType) {
                score += 1000;
            }
        } else {
             // If no preference, slight penalty for VIP/Premium to keep them for those who want them
             // Or prioritize Premium/Regular. Let's just slightly penalize VIP if no preference
             if(block.seats[0].SeatType === 'VIP') score += 100;
        }

        block.score = score;
    });

    // 4. Return best block
    candidateBlocks.sort((a, b) => a.score - b.score);
    return candidateBlocks[0].seats;
}

function extractSubBlocks(sequence, requestedSize, candidateBlocks, rowLength) {
    // If sequence is larger than requested, extract all possible sub-blocks of exact size
    // Example: sequence is 6, requested is 4. Sub-blocks: [0..3], [1..4], [2..5]
    for (let i = 0; i <= sequence.length - requestedSize; i++) {
        const subBlock = sequence.slice(i, i + requestedSize);
        candidateBlocks.push({
            seats: subBlock,
            rowLength: rowLength
        });
    }
}

module.exports = { findBestContiguousSeats };
