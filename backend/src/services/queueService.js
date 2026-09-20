let PQueueClass = null;

class QueueService {
    constructor() {
        // Map to hold a queue for each ShowID
        // Serializes bookings for the SAME show to prevent conflicts
        this.queues = new Map();
    }

    async _getPQueue() {
        if (!PQueueClass) {
            try {
                const pqueueMod = await import('p-queue');
                PQueueClass = pqueueMod.default || pqueueMod;
            } catch (e) {
                console.warn('[QUEUE] Could not dynamically import p-queue, using fallback promise chain:', e.message);
            }
        }
        return PQueueClass;
    }

    async enqueueBookingRequest(showId, task) {
        const PQueue = await this._getPQueue();
        if (PQueue) {
            if (!this.queues.has(showId)) {
                this.queues.set(showId, new PQueue({ concurrency: 1 }));
            }
            const queue = this.queues.get(showId);
            console.log(`[QUEUE] Booking request added for ShowID: ${showId}. Queue size: ${queue.size}`);
            return queue.add(async () => {
                console.log(`[QUEUE] Processing booking request for ShowID: ${showId}`);
                return await task();
            });
        }

        // Lightweight promise chain fallback (Concurrency 1 FIFO)
        const previous = this.queues.get(showId) || Promise.resolve();
        const runTask = async () => {
            console.log(`[QUEUE] Processing booking request for ShowID: ${showId}`);
            return await task();
        };

        const current = previous.then(runTask, runTask);
        this.queues.set(showId, current.catch(() => {}));
        return current;
    }
}

module.exports = new QueueService();
