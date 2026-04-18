export function PhoneCarouselKeyframes() {
  return (
    <style jsx>{`
      @keyframes typingBounce {
        0%,
        60%,
        100% {
          transform: translateY(0);
        }
        30% {
          transform: translateY(-4px);
        }
      }
      @keyframes waveform {
        0% {
          height: 3px;
        }
        100% {
          height: 14px;
        }
      }
      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(40px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-40px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `}</style>
  );
}
