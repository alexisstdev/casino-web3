import { X } from "lucide-react";
import type { ReactNode } from "react";

interface DialogProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	size?: "sm" | "md" | "lg";
}

const sizeClasses = {
	sm: "max-w-xs",
	md: "max-w-sm",
	lg: "max-w-md",
};

export const Dialog = ({
	isOpen,
	onClose,
	title,
	children,
	size = "sm",
}: DialogProps) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
			<div
				className={`bg-[#1a1b26] border border-slate-700 rounded-xl p-4 w-full ${sizeClasses[size]}`}
			>
				<div className="flex items-center justify-between mb-4">
					<span className="font-bold text-white text-sm">{title}</span>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded hover:bg-slate-800 transition-colors"
					>
						<X className="w-4 h-4 text-slate-500 hover:text-white" />
					</button>
				</div>
				{children}
			</div>
		</div>
	);
};
