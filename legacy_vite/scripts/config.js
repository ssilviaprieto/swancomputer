// Minimal config for hackathon MVP
// Base Sepolia chain constants
export const CHAIN_ID = 84532; // Base Sepolia
export const CHAIN_NAME = 'Base Sepolia';

// Optional RPC for read-only features (not required for MVP)
// Keep empty or set via Vite env: VITE_BASE_SEPOLIA_RPC
export const RPC_URL = import.meta?.env?.VITE_BASE_SEPOLIA_RPC || '';

// Placeholder for contract address to be filled after deploy
// Set via Vite env: VITE_CONTRACT_ADDRESS
export const CONTRACT_ADDRESS = import.meta?.env?.VITE_CONTRACT_ADDRESS || '';

