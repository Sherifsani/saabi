import createGlobe from "cobe";
import { useEffect, useRef } from "react";

export default function SaabiGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;
    let width = 0;
    let currentScroll = 0;
    let targetScroll = 0;

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();
    
    const onScroll = () => {
        targetScroll = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const globe = createGlobe(canvasRef.current!, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 24000,
      mapBrightness: 6,
      baseColor: [0.05, 0.05, 0.05], // Nearly black globe
      markerColor: [228 / 255, 93 / 255, 0], // #E45D00 (gt-orange)
      glowColor: [0.02, 0.02, 0.02],
      markers: [
        // Focus on Africa & key cities
        { location: [6.5244, 3.3792], size: 0.12 }, // Lagos
        { location: [9.0820, 8.6753], size: 0.05 }, // Abuja
        { location: [4.8156, 7.0498], size: 0.08 }, // Port Harcourt
        { location: [5.6037, -0.1870], size: 0.07 }, // Accra
        { location: [-1.2921, 36.8219], size: 0.06 }, // Nairobi
        { location: [-26.2041, 28.0473], size: 0.06 }, // Johannesburg
        { location: [30.0444, 31.2357], size: 0.08 }, // Cairo
        { location: [51.5074, -0.1278], size: 0.04 }, // London
        { location: [40.7128, -74.0060], size: 0.05 }, // NYC
      ],
      onRender: (state) => {
        // Create smooth scrolling
        currentScroll += (targetScroll - currentScroll) * 0.05;
        
        // Base rotation
        phi += 0.003;
        
        // Incorporate smooth scroll rotation
        state.phi = phi + currentScroll * 0.003;
        state.theta = 0.3 + currentScroll * 0.001; 

        state.width = width * 2;
        state.height = width * 2;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-20 w-full min-h-[150vh] overflow-hidden flex flex-col items-center pointer-events-none">
      {/* Globe Container - pushed down slightly so half shows on smaller screens */}
      <div className="relative w-[150vw] sm:w-[120vw] md:w-[90vw] lg:w-[80vw] max-w-[1200px] aspect-square mt-[30vh] md:mt-[40vh] opacity-90 transition-transform duration-1000 ease-out">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
      
      {/* Professional Dark Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent -z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-transparent to-transparent -z-10" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_#0A0A0A_100%)] opacity-80 -z-10" />
    </div>
  );
}
