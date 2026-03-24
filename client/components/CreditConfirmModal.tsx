import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface CreditConfirmModalProps {
  isOpen: boolean;
  creditsNeeded: number;
  creditsAvailable: number;
  actionName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const CreditConfirmModal: React.FC<CreditConfirmModalProps> = ({
  isOpen,
  creditsNeeded,
  creditsAvailable,
  actionName,
  onConfirm,
  onCancel,
  isProcessing = false,
}) => {
  const hasEnoughCredits = creditsAvailable >= creditsNeeded;

  if (!hasEnoughCredits) {
    return (
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <AlertDialogContent className="border border-[hsl(var(--neon-purple))] bg-black/80 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-cyan-400">
              Insufficient Credits
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              You don't have enough credits for this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Credits needed:</span>
              <span className="font-semibold text-[hsl(var(--neon-cyan))]">
                {creditsNeeded}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Credits available:</span>
              <span className="font-semibold text-cyan-400">
                {creditsAvailable}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Shortage:</span>
              <span className="font-semibold text-orange-500">
                {creditsNeeded - creditsAvailable}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 bg-gray-900/50 p-3 rounded">
            Upgrade your plan or buy a credit pack to continue.
          </p>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="bg-gray-800 hover:bg-gray-700 text-white border-gray-600">
              Close
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="border border-[hsl(var(--neon-purple))] bg-black/80 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Confirm credit use
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            This action costs <span className="font-semibold text-[hsl(var(--neon-cyan))]">{creditsNeeded} credits</span>. You have{" "}
            <span className="font-semibold text-[hsl(var(--neon-purple))]">
              {creditsAvailable}
            </span>{" "}
            credits remaining.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
            <h4 className="font-semibold text-white mb-2">Action</h4>
            <p className="text-gray-300">{actionName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/30 p-3 rounded">
              <p className="text-xs text-gray-400 mb-1">Credits needed</p>
              <p className="text-lg font-bold text-[hsl(var(--neon-cyan))]">
                {creditsNeeded}
              </p>
            </div>
            <div className="bg-gray-900/30 p-3 rounded">
              <p className="text-xs text-gray-400 mb-1">Remaining after</p>
              <p className="text-lg font-bold text-[hsl(var(--neon-purple))]">
                {creditsAvailable - creditsNeeded}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel
            disabled={isProcessing}
            className="bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isProcessing}
            onClick={onConfirm}
            className="bg-[hsl(var(--neon-cyan))] hover:bg-[hsl(var(--neon-cyan))]/80 text-black font-semibold"
          >
            {isProcessing ? "Processing..." : "Continue"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
