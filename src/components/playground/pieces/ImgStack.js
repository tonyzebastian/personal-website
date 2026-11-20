'use client'
import { useState, useRef } from 'react';
import { m } from 'motion/react';
import Fit from '../Fit';

export default function ImgStack({ images }) {
    const [cards, setCards] = useState(
        images.map((src, index) => ({
            id: index,
            src: src,
            zIndex: 50 - (index * 10)
        }))
    );
    const [isAnimating, setIsAnimating] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const minDragDistance = 50;

    const getCardStyles = (index) => {
        // Always return tiled state - no initial animation to prevent jumping
        const baseRotation = 2; // Base tilt angle
        const rotationIncrement = 3; // Additional tilt per card
        const offsetIncrement = -12; // Horizontal offset per card
        const verticalOffset = -8; // Vertical offset per card

        return {
            x: index * offsetIncrement,
            y: index * verticalOffset,
            // Keep first card straight (index 0), others get tilt
            rotate: index === 0 ? 0 : -(baseRotation + (index * rotationIncrement)),
            scale: 1,
            transition: { duration: 0.5, ease: "easeOut" }
        };
    };

    const handleDragStart = (_, info) => {
        dragStartPos.current = { x: info.point.x, y: info.point.y };
    };

    const handleDragEnd = (_, info) => {
        const dragDistance = Math.sqrt(
            Math.pow(info.point.x - dragStartPos.current.x, 2) +
            Math.pow(info.point.y - dragStartPos.current.y, 2)
        );

        if (isAnimating) return;

        if (dragDistance < minDragDistance) {
            // Let Motion handle the snap-back automatically by not doing anything
            return;
        }

        setIsAnimating(true);

        // Move card to back and reassign proper z-index values
        setCards(prevCards => {
            const newCards = [...prevCards];
            const cardToMove = newCards.shift(); // Remove first card
            newCards.push(cardToMove); // Add to end

            // Reassign z-index values to maintain proper stacking order
            return newCards.map((card, index) => ({
                ...card,
                zIndex: 50 - (index * 10) // Top card gets 50, next gets 40, etc.
            }));
        });

        // Brief delay to allow the position change to register
        setTimeout(() => {
            setIsAnimating(false);
        }, 300);
    };

    return (
        <div className="relative flex items-center justify-center w-96 h-96 my-12">
            {cards.map((card, index) => {
                const isTopCard = index === 0;
                const cardStyles = getCardStyles(index);
                const canDrag = isTopCard && !isAnimating;

                return (
                    <m.div
                        key={card.id}
                        className="absolute w-64 origin-bottom overflow-hidden rounded-xl shadow-xl bg-white cursor-grab active:cursor-grabbing border border-gray-100"
                        style={{
                            zIndex: card.zIndex,
                            aspectRatio: '5/7'
                        }}
                        animate={cardStyles}
                        drag={canDrag}
                        dragElastic={0.2}
                        dragConstraints={{ left: -150, right: 150, top: -150, bottom: 150 }}
                        dragSnapToOrigin={true}
                        dragTransition={{ bounceStiffness: 600, bounceDamping: 10 }}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        whileHover={isTopCard ? {
                            scale: 1.05,
                            transition: { duration: 0.2, ease: "easeOut" }
                        } : {}}
                        whileDrag={{
                            scale: 1.1,
                            rotate: 0,
                            zIndex: 100,
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            transition: { duration: 0.1 }
                        }}
                    >
                        <img
                            src={card.src}
                            alt={`Card ${card.id + 1}`}
                            className="absolute inset-0 w-full h-full object-cover rounded-xl pointer-events-none"
                            draggable={false}
                        />
                    </m.div>
                );
            })}
        </div>
    );
}

// Playground piece (from the playground repo's img-stack page).
const STACK_IMAGES = [
    'https://images.unsplash.com/photo-1742201877377-03d18a323c18?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1064',
    'https://images.unsplash.com/photo-1757081791153-3f48cd8c67ac?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987',
    'https://images.unsplash.com/photo-1757626961383-be254afee9a0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987',
    'https://images.unsplash.com/photo-1756748371390-099e4e6683ae?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987',
    'https://images.unsplash.com/photo-1755884405235-5c0213aa3374?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987',
];

export function Piece() {
    return (
        <Fit width={480} height={480}>
            <div className="flex size-full items-center justify-center">
                <ImgStack images={STACK_IMAGES} />
            </div>
        </Fit>
    );
}
