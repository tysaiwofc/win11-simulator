function fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.min(progress / duration, 1);
      element.style.opacity = opacity.toString();
      
      if (progress < duration) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }
  
  function slideUp(element, duration = 300) {
    element.style.transform = 'translateY(20px)';
    element.style.display = 'block';
    
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const translateY = 20 - Math.min(progress / duration, 1) * 20;
      element.style.transform = `translateY(${translateY}px)`;
      
      if (progress < duration) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }
  
  module.exports = {
    fadeIn,
    slideUp
  };