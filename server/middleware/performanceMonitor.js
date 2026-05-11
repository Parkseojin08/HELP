/**
 * Performance Monitoring Middleware
 * 모든 API 요청의 응답 시간을 측정하고 로깅합니다.
 * 느린 요청(>500ms)을 경고합니다.
 */

const performanceMonitor = (req, res, next) => {
    const start = process.hrtime.bigint(); // 나노초 단위의 정밀 시간 측정

    // Response 종료 시 실행
    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1_000_000; // 밀리초로 변환

        const logData = {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: duration.toFixed(2) + 'ms',
            timestamp: new Date().toISOString(),
            userId: req.user?.user_id || 'anonymous'
        };

        // 성능 목표: 200ms 이하
        if (duration > 500) {
            console.warn(`[SLOW_REQUEST] ${duration.toFixed(2)}ms`, logData);
        } else if (duration > 200) {
            console.log(`[MODERATE_REQUEST] ${duration.toFixed(2)}ms`, logData);
        } else {
            console.log(`[FAST_REQUEST] ${duration.toFixed(2)}ms`, logData);
        }

        // 응답 헤더에 응답 시간 추가
        res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
    });

    next();
};

module.exports = performanceMonitor;
