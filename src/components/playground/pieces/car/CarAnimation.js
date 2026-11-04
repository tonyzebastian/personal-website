export default function CarAnimation({ currentFrame, imageCache }) {
  // Use cached image if available, fallback to regular src
  const getCachedImageSrc = () => {
    if (imageCache && imageCache.has(`car_${currentFrame}`)) {
      return imageCache.get(`car_${currentFrame}`).src;
    }
    return `/playground/car/car_${currentFrame}.webp`;
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Car Animation */}
      <div className="flex h-56 w-full items-center justify-center @3xl:h-96">
        <img 
          src={getCachedImageSrc()}
          alt={`Car frame ${currentFrame}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  );
}