"use client";

import { useState, useRef, useEffect } from "react";
import { useGame } from "@/context/gameContext";

export const GameControls = () => {
    const { connectAndSend, gameId } = useGame();
    const [gameIdInput, setGameIdInput] = useState("");
    const [pending, setPending] = useState<"create" | "join" | null>(null);

    const modalRef = useRef<HTMLDialogElement>(null);

    const handleOpenModal = () => {
        setGameIdInput("");
        modalRef.current?.showModal();
    };

    const handleCloseModal = () => {
        modalRef.current?.close();
    };

    const handleJoinSubmit = (e: React.SubmitEvent | React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if (!gameIdInput.trim()) return;

        setPending("join");
        connectAndSend({
            type: "JOIN_GAME",
            payload: { gameId: gameIdInput.trim() },
        });

        handleCloseModal();
    };

    useEffect(() => {
        if (gameId) {
            setPending(null);
        }
    }, [gameId]);

    return (
        <>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto p-4">
                <button
                    className="btn btn-primary flex-1 shadow-lg hover:shadow-xl py-2 transition-all"
                    disabled={pending !== null}
                    onClick={() => {
                        setPending("create");
                        connectAndSend({ type: "CREATE_GAME", payload: {} });
                    }}
                >
                    {pending ? (
                        <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Game
                        </>
                    )}
                </button>

                <button
                    className="btn btn-secondary flex-1 shadow-lg hover:shadow-xl py-2 transition-all"
                    onClick={handleOpenModal}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Join Game
                </button>
            </div>

            {/* JOIN ROOM Modal */}
            <dialog id="join_game_modal" className="modal" ref={modalRef}>
                <div className="modal-box w-11/12 max-w-sm">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={handleCloseModal}>✕</button>
                    </form>

                    <h3 className="font-bold text-lg mb-4 text-center">Join Existing Game</h3>

                    <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4">
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium mb-1">Enter Game ID</span>
                            </label>
                            <input
                                type="text"
                                placeholder="EX - 13CC02ED"
                                className="input input-bordered w-full focus:input-primary"
                                value={gameIdInput}
                                onChange={(e) => setGameIdInput(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !gameIdInput.trim()) {
                                        e.preventDefault();
                                    }
                                }}
                            />
                        </div>

                        <div className="modal-action">
                            <button
                                type="submit"
                                className="btn btn-primary w-full"
                                disabled={!gameIdInput.trim() || pending !== null}
                            >
                                {pending ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    "Join Now"
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Backdrop click to close */}
                <form method="dialog" className="modal-backdrop">
                    <button onClick={handleCloseModal}>close</button>
                </form>
            </dialog>
        </>
    );
};