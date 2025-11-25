import type { LucideIcon } from "lucide-react";

interface StatCardProps {
	title: string;
	value: string | number;
	icon: string | LucideIcon;
	color: "purple" | "orange" | "green" | "blue" | "yellow";
}

const colorClasses = {
	purple: "bg-purple-900/30 border-purple-400",
	orange: "bg-orange-900/30 border-orange-400",
	green: "bg-green-900/30 border-green-400",
	blue: "bg-blue-900/30 border-blue-400",
	yellow: "bg-yellow-900/30 border-yellow-400",
};

export const StatCard = ({ title, value, icon, color }: StatCardProps) => (
	<div
		className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${colorClasses[color]}`}
	>
		<div className="p-3 flex flex-col items-center relative z-10">
			<div className="mb-1 text-2xl">
				{typeof icon === "string" ? icon : null}
			</div>
			<span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
				{title}
			</span>
			<span className="text-2xl font-black font-mono text-white drop-shadow-sm">
				{value}
			</span>
		</div>
	</div>
);
