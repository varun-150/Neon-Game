# 🌌 NEON PULSE: ARCHITECT
> **A High-Octane, Cyberpunk Survival Shooter**

## ⚡ Overview
**Neon Pulse** is a fast-paced, high-fidelity browser survival game built with modern JavaScript and vanilla CSS. Navigate a glowing ship through a hostile cyberpunk city, survive waves of adaptive enemies, and collect data packets to climb the leaderboards.

### 🎥 Gameplay Preview
| Phase | Action |
| :--- | :--- |
| **Countdown** | Active |
| **Survival** | Verified |

---

## 🚀 Key Features
- **Dynamic Entity System**: Modular code structure removing global dependencies for smoother performance.
- **Adaptive Threat Levels**: Difficulty scales as you survive, introducing new enemy archetypes like *Chasers* and *Wanderers*.
- **I-Frame Protection**: Advanced collision logic with invulnerability frames and visual blinking for a fair experience.
- **Neon Aesthetics**: Custom-built CSS animations (Glitch effects, Pulse borders, Bloom lighting).
- **Grace Period Initiation**: A 3-second lead-time countdown to ensure you're ready for combat.

---

## 🎮 Controls
| Key | Action |
| :--- | :--- |
| `W` / `Arrow Up` | Move Up |
| `S` / `Arrow Down` | Move Down |
| `A` / `Arrow Left` | Move Left |
| `D` / `Arrow Right` | Move Right |
| `Mouse Move` | Aim Ship |
| `Left Click` | Fire Pulsar Cannon |

---

## 🛠️ Technical Stack
- **Engine**: Custom Canvas Engine (JavaScript ES6+)
- **Styling**: Vanilla CSS with Glassmorphism and Neon Glitch filters.
- **Server**: Node.js Lightweight Development Server.
- **Design Principles**: Based on the *MDA Framework (Mechanics-Dynamics-Aesthetics)*.

---

## 🔧 Installation & Setup
1. **Clone the repository**:
   ```powershell
   git clone <repo-url>
   cd "neon game"
   ```
2. **Start the local server**:
   ```node
   node serve-local.js
   ```
3. **Open in browser**:
   Navigate to `http://127.0.0.1:8080` and click **Initiate Protocol**.

---

## 📝 Recent Development Logs
- **v2.0**: Total removal of `window.game` global scope; converted to explicit dependency injection.
- **v2.1**: Integrated 3-second countdown and randomized cyberpunk background rendering.
- **v2.2**: Implemented the Invulnerability Frame system for the player ship.

---
