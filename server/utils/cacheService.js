/**
 * Cache Service - 메모리 기반 캐싱 (Redis는 선택사항)
 * 
 * 사용 예:
 * const cache = require('./cacheService');
 * 
 * // 데이터 저장
 * cache.set('group:123', groupData, 5 * 60); // 5분 TTL
 * 
 * // 데이터 조회
 * const data = cache.get('group:123');
 * 
 * // 캐시 삭제
 * cache.delete('group:123');
 * cache.clear(); // 전체 캐시 삭제
 */

const MemoryCache = class {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
    }

    /**
     * 캐시에 데이터 저장
     * @param {string} key - 캐시 키
     * @param {any} value - 저장할 값
     * @param {number} ttl - TTL (초)
     */
    set(key, value, ttl = 300) {
        // 기존 타이머 제거
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        // 데이터 저장
        this.cache.set(key, {
            value,
            createdAt: Date.now(),
            ttl
        });

        // TTL 타이머 설정
        const timer = setTimeout(() => {
            this.cache.delete(key);
            this.timers.delete(key);
        }, ttl * 1000);

        this.timers.set(key, timer);

        console.log(`[Cache] SET ${key} (TTL: ${ttl}s)`);
    }

    /**
     * 캐시에서 데이터 조회
     * @param {string} key - 캐시 키
     * @returns {any|null} 캐시된 값 또는 null
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        console.log(`[Cache] HIT ${key}`);
        return item.value;
    }

    /**
     * 캐시에서 데이터 삭제
     * @param {string} key - 캐시 키
     */
    delete(key) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
        this.cache.delete(key);
        console.log(`[Cache] DELETE ${key}`);
    }

    /**
     * 패턴에 맞는 캐시 삭제 (예: 'group:*')
     * @param {string} pattern - 패턴 (정규식 문자열)
     */
    deletePattern(pattern) {
        const regex = new RegExp(pattern);
        const keys = Array.from(this.cache.keys());
        
        keys.forEach(key => {
            if (regex.test(key)) {
                this.delete(key);
            }
        });
    }

    /**
     * 전체 캐시 삭제
     */
    clear() {
        Array.from(this.timers.values()).forEach(timer => clearTimeout(timer));
        this.cache.clear();
        this.timers.clear();
        console.log(`[Cache] CLEAR all`);
    }

    /**
     * 캐시 통계
     */
    stats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
};

const memoryCache = new MemoryCache();

/**
 * Redis 캐시 (선택사항 - redis 라이브러리 필요)
 * npm install redis
 */
let redisClient = null;

const initRedis = async () => {
    try {
        const redis = require('redis');
        redisClient = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined
        });

        redisClient.on('error', (err) => {
            console.error('[Redis] Error:', err);
            redisClient = null; // Fallback to memory cache
        });

        redisClient.on('connect', () => {
            console.log('[Redis] Connected');
        });

        await redisClient.connect();
        return true;
    } catch (err) {
        console.warn('[Redis] Not available, using memory cache:', err.message);
        return false;
    }
};

const CacheService = {
    /**
     * Redis 초기화 (선택사항)
     */
    async initRedis() {
        return await initRedis();
    },

    /**
     * 캐시에 데이터 저장
     */
    async set(key, value, ttl = 300) {
        // Memory cache에 저장
        memoryCache.set(key, value, ttl);

        // Redis에 저장 (사용 가능한 경우)
        if (redisClient) {
            try {
                await redisClient.setEx(key, ttl, JSON.stringify(value));
            } catch (err) {
                console.error('[Redis] SET error:', err);
            }
        }
    },

    /**
     * 캐시에서 데이터 조회
     */
    async get(key) {
        // Memory cache에서 먼저 조회
        let value = memoryCache.get(key);
        if (value !== null) return value;

        // Redis에서 조회 (사용 가능한 경우)
        if (redisClient) {
            try {
                const cached = await redisClient.get(key);
                if (cached) {
                    value = JSON.parse(cached);
                    // Memory cache에 저장
                    memoryCache.set(key, value, 300);
                    return value;
                }
            } catch (err) {
                console.error('[Redis] GET error:', err);
            }
        }

        return null;
    },

    /**
     * 캐시에서 데이터 삭제
     */
    async delete(key) {
        memoryCache.delete(key);

        if (redisClient) {
            try {
                await redisClient.del(key);
            } catch (err) {
                console.error('[Redis] DELETE error:', err);
            }
        }
    },

    /**
     * 패턴에 맞는 캐시 삭제
     */
    async deletePattern(pattern) {
        memoryCache.deletePattern(pattern);

        if (redisClient) {
            try {
                const keys = await redisClient.keys(pattern);
                if (keys.length > 0) {
                    await redisClient.del(keys);
                }
            } catch (err) {
                console.error('[Redis] DELETEPATTERN error:', err);
            }
        }
    },

    /**
     * 전체 캐시 삭제
     */
    async clear() {
        memoryCache.clear();

        if (redisClient) {
            try {
                await redisClient.flushDb();
            } catch (err) {
                console.error('[Redis] CLEAR error:', err);
            }
        }
    },

    /**
     * 캐시 통계
     */
    stats() {
        return {
            memory: memoryCache.stats(),
            redis: redisClient ? 'connected' : 'not available'
        };
    }
};

module.exports = CacheService;
