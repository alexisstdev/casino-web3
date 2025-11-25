import type { SoundType } from "../types/game";

const SOUND_CONFIGS: Record<
	SoundType,
	{
		type: OscillatorType;
		startFreq: number;
		endFreq?: number;
		gain: number;
		duration: number;
	}
> = {
	hover: {
		type: "square",
		startFreq: 200,
		gain: 0.02,
		duration: 0.05,
	},
	click: {
		type: "triangle",
		startFreq: 600,
		gain: 0.1,
		duration: 0.1,
	},
	sign: {
		type: "sawtooth",
		startFreq: 800,
		endFreq: 1200,
		gain: 0.05,
		duration: 0.3,
	},
	coin: {
		type: "sine",
		startFreq: 1200,
		endFreq: 2000,
		gain: 0.1,
		duration: 0.5,
	},
};

export const playSound = (type: SoundType): void => {
	try {
		const AudioContext =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext: typeof window.AudioContext })
				.webkitAudioContext;
		if (!AudioContext) return;

		const ctx = new AudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		const filter = ctx.createBiquadFilter();

		filter.type = "lowpass";
		filter.frequency.value = 1000;

		osc.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);

		const config = SOUND_CONFIGS[type];
		const now = ctx.currentTime;

		osc.type = config.type;
		osc.frequency.setValueAtTime(config.startFreq, now);

		if (config.endFreq) {
			if (type === "sign") {
				osc.frequency.linearRampToValueAtTime(
					config.endFreq,
					now + config.duration,
				);
			} else {
				osc.frequency.exponentialRampToValueAtTime(
					config.endFreq,
					now + config.duration * 0.2,
				);
			}
		}

		gain.gain.setValueAtTime(config.gain, now);

		if (type === "click") {
			gain.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
		} else {
			gain.gain.linearRampToValueAtTime(0, now + config.duration);
		}

		osc.start(now);
		osc.stop(now + config.duration);
	} catch (error) {
		console.warn("Sound playback failed:", error);
	}
};
