'use client'
import { m } from "motion/react";
import Fit from "../Fit";

export default function ImageReveal({ leftImage, middleImage, rightImage }) {
    const containerVariants = {
        initial: {
            opacity: 0,
        },
        animate: {
            opacity: 1,
            transition: {
                delay: 0.2,
                staggerChildren: 0.15,
            }
        }
    };

    const leftImageVariants = {
        initial: { rotate: 0, x: 0, y: 0 },
        animate: {
            rotate: -8,
            x: -150,
            y: 10,
            transition: {
                type: "spring",
                stiffness: 120,
                damping: 12
            }
        },
        hover: {
            rotate: 1,
            x: -160,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 15
            }
        }
    };

    const middleImageVariants = {
        initial: { rotate: 0, x: 0, y: 0 },
        animate: {
            rotate: 6,
            x: 0,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 120,
                damping: 12
            }
        },
        hover: {
            rotate: 0,
            x: 0,
            y: -10,
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 15
            }
        }
    };

    const rightImageVariants = {
        initial: { rotate: 0, x: 0, y: 0 },
        animate: {
            rotate: -6,
            x: 200,
            y: 20,
            transition: {
                type: "spring",
                stiffness: 120,
                damping: 12
            }
        },
        hover: {
            rotate: 3,
            x: 200,
            y: 10,
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 15
            }
        }
    };

    return (
        <div>
        <m.div 
            className="relative flex items-center justify-center w-64 h-64 my-12 "
            variants={containerVariants}
            initial="initial"
            animate="animate"
        >
            {/* Left Image - Lowest z-index */}
            <m.div
                className="absolute w-48 h-48 origin-bottom-right overflow-hidden rounded-xl shadow-lg bg-white"
                variants={leftImageVariants}
                whileHover="hover"
                animate="animate"
                style={{ zIndex: 10 }}
            >
                <img
                    src={leftImage}
                    alt="Left image"
                    className="w-full h-full object-cover p-2 rounded-xl"
                />
            </m.div>

            {/* Middle Image - Middle z-index */}
            <m.div
                className="absolute w-48 h-48 origin-bottom-left overflow-hidden rounded-xl shadow-lg bg-white"
                variants={middleImageVariants}
                whileHover="hover"
                animate="animate"
                style={{ zIndex: 20 }}
            >
                <img
                    src={middleImage}
                    alt="Middle image"
                    className="w-full h-full object-cover p-2 rounded-2xl"
                />
            </m.div>

            {/* Right Image - Highest z-index */}
            <m.div
                className="absolute w-48 h-48 origin-bottom-right overflow-hidden rounded-xl shadow-lg bg-white"
                variants={rightImageVariants}
                whileHover="hover"
                animate="animate"
                style={{ zIndex: 30 }}
            >
                <img
                    src={rightImage}
                    alt="Right image"
                    className="w-full h-full object-cover p-2 rounded-2xl"
                />
            </m.div>
        </m.div>
        </div>
    );
}

// Playground piece (from the playground repo's img-tiles page). The fan spans
// about 640px around a 256px centre, offset to the right, hence the shift.
export function Piece() {
    return (
        <Fit width={720} height={400}>
            <div className="flex size-full items-center justify-center pr-12">
                <ImageReveal
                    leftImage="https://images.unsplash.com/photo-1758178309498-036c3d7d73b3?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987"
                    middleImage="https://images.unsplash.com/photo-1757647016230-d6b42abc6cc9?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2072"
                    rightImage="https://images.unsplash.com/photo-1757906447358-f2b2cb23d5d8?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987"
                />
            </div>
        </Fit>
    );
}
