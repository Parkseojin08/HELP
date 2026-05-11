// 성능 모니터링 유틸 함수

export const measurePerformance = (label, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${label}: ${(end - start).toFixed(2)}ms`);
  return result;
};

export const measureAsyncPerformance = async (label, fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`${label}: ${(end - start).toFixed(2)}ms`);
  return result;
};

// 이미지 LazyLoad 유틸
export const createImageObserver = (options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: "50px",
    threshold: 0.01,
    ...options,
  };

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          observer.unobserve(img);
        }
      }
    });
  }, defaultOptions);
};

// 가상 스크롤 기본 계산 함수
export const calculateVirtualScroll = (
  itemCount,
  itemHeight,
  containerHeight,
  scrollTop
) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endIndex = Math.min(itemCount, startIndex + visibleCount + 1);

  return {
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight,
    visibleItems: itemCount > 0 ? endIndex - startIndex : 0,
  };
};
