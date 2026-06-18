import * as THREE from 'three';

export const stagesInfo = [
    { name: 'Sky', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 0.9, pinCol: 0xffffff, puddleCol: 0x1ca3ec, gateFrame: 0x00ccff, gateDoor: 0xffaa00, gateHandle: 0xff00ff, trail: true, trailCol: 0xF5DEB3, emoji: '☁️', notes: [261.6, 329.6, 392.0, 523.3, 392.0, 329.6, 261.6, 392.0, 440.0, 392.0, 349.2, 329.6, 293.7, 329.6, 392.0, 523.3, 261.6, 329.6, 392.0, 659.3, 523.3, 392.0, 261.6, 392.0, 440.0, 523.3, 587.3, 523.3, 440.0, 392.0, 349.2, 293.7, 261.6, 329.6, 392.0, 523.3, 392.0, 329.6, 261.6, 329.6, 392.0, 440.0, 392.0, 329.6, 261.6, 196.0, 261.6, 329.6], wave: 'sine' },
    { name: 'Neon City', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 0.7, pinCol: 0xFFFB00, puddleCol: 0xFF00EA, gateFrame: 0xff00ff, gateDoor: 0x00ffff, gateHandle: 0xffff00, trail: true, trailCol: 0x27EEF5, emoji: '🏙️', notes: [220.0, 261.6, 329.6, 220.0, 440.0, 329.6, 261.6, 329.6, 196.0, 246.9, 293.7, 196.0, 392.0, 293.7, 246.9, 293.7, 220.0, 261.6, 329.6, 440.0, 523.3, 440.0, 329.6, 261.6, 174.6, 220.0, 261.6, 349.2, 440.0, 349.2, 261.6, 220.0, 220.0, 261.6, 329.6, 220.0, 440.0, 329.6, 261.6, 329.6, 196.0, 246.9, 293.7, 196.0, 392.0, 293.7, 246.9, 293.7], wave: 'square' },
    { name: 'Forest', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 0.95, pinCol: 0x5c4033, puddleCol: 0xa67b5b, gateFrame: 0x3d2817, gateDoor: 0x228b22, gateHandle: 0x8b4513, trail: true, trailCol: 0x3b7a33, emoji: '🌲', notes: [220.0, 261.6, 329.6, 440.0, 329.6, 261.6, 220.0, 261.6, 174.6, 220.0, 261.6, 349.2, 261.6, 220.0, 174.6, 261.6, 220.0, 329.6, 440.0, 523.3, 440.0, 329.6, 220.0, 329.6, 196.0, 293.7, 392.0, 440.0, 392.0, 293.7, 196.0, 293.7, 220.0, 261.6, 329.6, 440.0, 329.6, 261.6, 220.0, 261.6, 174.6, 220.0, 261.6, 349.2, 261.6, 220.0, 174.6, 261.6], wave: 'sine' },
    { name: 'Snow', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 0.8, pinCol: 0x00bfff, puddleCol: 0xaaddff, gateFrame: 0xffffff, gateDoor: 0x88ccff, gateHandle: 0x0000ff, trail: true, trailCol: 0xeeeeee, emoji: '⛄', notes: [392.0, 440.0, 523.3, 587.3, 659.3, 587.3, 523.3, 440.0, 392.0, 329.6, 392.0, 440.0, 523.3, 440.0, 392.0, 329.6, 392.0, 523.3, 783.9, 523.3, 392.0, 329.6, 261.6, 329.6, 349.2, 440.0, 523.3, 440.0, 349.2, 261.6, 196.0, 261.6, 392.0, 329.6, 261.6, 196.0, 164.8, 196.0, 261.6, 329.6, 261.6, 196.0, 164.8, 146.8, 130.8, 146.8, 164.8, 196.0], wave: 'triangle' },
    { name: 'Volcano', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 0.9, pinCol: 0x595959, puddleCol: 0x6E0000, gateFrame: 0x111111, gateDoor: 0xff3300, gateHandle: 0xffff00, trail: true, trailCol: 0xff3300, emoji: '🌋', notes: [130.8, 138.6, 164.8, 174.6, 196.0, 174.6, 164.8, 138.6, 130.8, 196.0, 174.6, 164.8, 138.6, 164.8, 174.6, 196.0, 130.8, 164.8, 196.0, 261.6, 196.0, 164.8, 130.8, 164.8, 138.6, 174.6, 207.65, 277.18, 207.65, 174.6, 138.6, 174.6, 130.8, 138.6, 164.8, 174.6, 196.0, 174.6, 164.8, 138.6, 146.8, 155.6, 174.6, 185.0, 220.0, 185.0, 155.6, 146.8], wave: 'sawtooth' },
    { name: 'Desert', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 1.0, pinCol: 0x2e8b57, puddleCol: 0xc2b280, gateFrame: 0xEDC9Af, gateDoor: 0x8b4513, gateHandle: 0x000000, trail: true, trailCol: 0xEDC9Af, emoji: '🌵', notes: [146.8, 155.6, 185.0, 220.0, 185.0, 155.6, 146.8, 220.0, 293.7, 220.0, 185.0, 155.6, 146.8, 155.6, 185.0, 220.0, 146.8, 220.0, 293.7, 311.1, 293.7, 220.0, 185.0, 155.6, 130.8, 196.0, 261.6, 311.1, 261.6, 196.0, 155.6, 146.8, 146.8, 155.6, 185.0, 220.0, 185.0, 155.6, 146.8, 220.0, 246.9, 293.7, 329.6, 293.7, 246.9, 220.0, 196.0, 261.6], wave: 'triangle' },
    { name: 'Beach', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 1.0, pinCol: 0xff5555, puddleCol: 0x22aaff, gateFrame: 0xF2D16B, gateDoor: 0x00aaff, gateHandle: 0xffaa00, trail: true, trailCol: 0xF2D16B, emoji: '🏖️', notes: [329.6, 392.0, 440.0, 523.3, 440.0, 392.0, 329.6, 440.0, 587.3, 440.0, 392.0, 329.6, 293.7, 329.6, 392.0, 523.3, 329.6, 392.0, 440.0, 659.3, 587.3, 523.3, 440.0, 523.3, 587.3, 659.3, 783.9, 659.3, 587.3, 523.3, 440.0, 392.0, 329.6, 392.0, 440.0, 523.3, 440.0, 392.0, 329.6, 392.0, 440.0, 523.3, 440.0, 392.0, 329.6, 293.7, 329.6, 392.0], wave: 'sine' },
    { name: 'Mountain', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 0.9, pinCol: 0xffffff, puddleCol: 0x446688, gateFrame: 0x4d5359, gateDoor: 0x8899aa, gateHandle: 0xcccccc, trail: true, trailCol: 0x666666, emoji: '⛰️', notes: [196.0, 261.6, 329.6, 392.0, 329.6, 261.6, 196.0, 261.6, 293.7, 261.6, 196.0, 164.8, 146.8, 164.8, 196.0, 261.6, 196.0, 261.6, 329.6, 440.0, 392.0, 329.6, 261.6, 329.6, 349.2, 392.0, 440.0, 392.0, 349.2, 329.6, 261.6, 196.0, 164.8, 196.0, 261.6, 329.6, 261.6, 196.0, 164.8, 196.0, 261.6, 329.6, 261.6, 196.0, 164.8, 146.8, 164.8, 196.0], wave: 'triangle' },
    { name: 'Space', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 0.7, pinCol: 0xffffff, puddleCol: 0x00ffcc, gateFrame: 0x555555, gateDoor: 0x000000, gateHandle: 0xffffff, trail: true, trailCol: 0x00ffff, emoji: '🚀', notes: [523.3, 659.3, 783.9, 659.3, 523.3, 392.0, 523.3, 659.3, 783.9, 659.3, 523.3, 392.0, 261.6, 329.6, 392.0, 523.3, 523.3, 659.3, 783.9, 659.3, 523.3, 392.0, 523.3, 659.3, 783.9, 659.3, 523.3, 392.0, 261.6, 329.6, 392.0, 523.3, 523.3, 659.3, 783.9, 659.3, 523.3, 392.0, 523.3, 659.3, 783.9, 659.3, 523.3, 392.0, 261.6, 329.6, 392.0, 523.3], wave: 'sawtooth' },
    { name: 'Candy', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 0.9, pinCol: 0xffb6c1, puddleCol: 0xff00ff, gateFrame: 0xff66bb, gateDoor: 0xffffff, gateHandle: 0xff0000, trail: true, trailCol: 0xffffff, emoji: '🍬', notes: [392.0, 440.0, 523.3, 587.3, 659.3, 587.3, 523.3, 440.0, 392.0, 329.6, 392.0, 440.0, 523.3, 440.0, 392.0, 329.6, 392.0, 523.3, 783.9, 523.3, 392.0, 329.6, 261.6, 329.6, 349.2, 440.0, 523.3, 440.0, 349.2, 261.6, 196.0, 261.6, 392.0, 329.6, 261.6, 196.0, 164.8, 196.0, 261.6, 329.6, 261.6, 196.0, 164.8, 146.8, 130.8, 146.8, 164.8, 196.0], wave: 'sine' },
    { name: 'Crystal', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 0.7, pinCol: 0x00ffff, puddleCol: 0x0000ff, gateFrame: 0x00ffff, gateDoor: 0xffffff, gateHandle: 0x00ffff, trail: true, trailCol: 0x00ffff, emoji: '💎', notes: [220.0, 261.6, 329.6, 220.0, 440.0, 329.6, 261.6, 329.6, 196.0, 246.9, 293.7, 196.0, 392.0, 293.7, 246.9, 293.7, 220.0, 261.6, 329.6, 440.0, 523.3, 440.0, 329.6, 261.6, 174.6, 220.0, 261.6, 349.2, 440.0, 349.2, 261.6, 220.0, 220.0, 261.6, 329.6, 220.0, 440.0, 329.6, 261.6, 329.6, 196.0, 246.9, 293.7, 196.0, 392.0, 293.7, 246.9, 293.7], wave: 'triangle' }
];

export function createDoorTex(emoji, bgColorHex) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#' + bgColorHex.toString(16).padStart(6, '0');
    ctx.fillRect(0,0,256,512);
    ctx.fillStyle = 'white';
    // Using standard emoji fonts ensures standard baselines to render centered
    ctx.font = '120px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji.replace(/\uFE0F/g, ''), 128, 256 + 15);
    return new THREE.CanvasTexture(c);
}

export function createPuTex(emoji, bgColorStr) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bgColorStr;
    ctx.fillRect(0,0,256,256);
    ctx.fillStyle = 'white';
    ctx.font = '120px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji.replace(/\uFE0F/g, ''), 128, 128 + 15);
    return new THREE.CanvasTexture(c);
}