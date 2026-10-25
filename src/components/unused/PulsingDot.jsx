export default function PulsingDot() {
    return (
        <div className="relative flex items-center justify-center w-2 h-2 mr-2">
            <div className="absolute w-2 h-2 rounded-full bg-green-500"></div>
            <div className="absolute w-3 h-3 rounded-full bg-green-400 blur-xs animate-pulse opacity-100 transition-transform"></div>
        </div>
    );
}