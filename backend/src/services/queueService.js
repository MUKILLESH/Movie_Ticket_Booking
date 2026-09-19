const { default: PQueue } = require('p-queue');

class QueueService {
    constructor() {
        // Map to hold a queue for each ShowID
        // This allows concurrent bookings for DIFFERENT shows
        // but serializes bookings for the SAME show to prevent conflicts
        this.queues = new Map();
    }

    getQueue(showId) {
        if (!this.queues.has(showId)) {
            // Concurrency 1 means jobs for this show are processed sequentially (FIFO)
            this.queues.set(showId, new PQueue({ concurrency: 1 }));
        }
        return this.queues.get(showId);
    }

    async enqueueBookingRequest(showId, task) {
        const queue = this.getQueue(showId);
        console.log(`[QUEUE] Booking request added for ShowID: ${showId}. Queue size: ${queue.size}`);
        
        return queue.add(async () => {
            console.log(`[QUEUE] Processing booking request for ShowID: ${showId}`);
            try {
                return await task();
            } catch (error) {
                console.error(`[QUEUE] Task failed for ShowID: ${showId}`, error);
                throw error; // Re-throw to be handled by the controller
            }
        });
    }
}

module.exports = new QueueService();
