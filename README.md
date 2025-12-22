# FC Online Tools

เครื่องมือจำลองระบบต่างๆ ใน FC Online รวมถึงระบบตีบวก, ระบบกล่อง และเครื่องคำนวณ OVR

## Getting Started

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

เปิด [http://localhost:3000](http://localhost:3000) ในเบราว์เซอร์

---

## โครงสร้างโปรเจค

```
src/
├── types/           ← TypeScript type definitions
│   ├── index.ts
│   ├── player.ts
│   ├── upgrade.ts
│   ├── box.ts
│   └── ovr.ts
│
├── config/          ← Configuration files
│   ├── index.ts
│   ├── app.config.ts
│   ├── upgrade.config.ts
│   ├── box.config.ts
│   └── api.config.ts
│
├── constants/       ← Static constants
│   ├── index.ts
│   ├── colors.ts
│   ├── messages.ts
│   └── limits.ts
│
├── services/        ← Business logic
│   ├── index.ts
│   ├── upgradeService.ts
│   ├── boxService.ts
│   ├── ovrService.ts
│   └── playerService.ts
│
├── hooks/           ← Custom React Hooks
│   ├── index.ts
│   ├── useUpgradeSimulator.ts
│   ├── useBoxSimulator.ts
│   ├── useOvrCalculator.ts
│   └── usePlayerSearch.ts
│
├── data/            ← Pure data only
│   ├── index.ts
│   ├── upgradeChances.ts
│   ├── boxData.ts
│   ├── ovrWeights.ts
│   └── allStats.ts
│
└── utils/           ← Re-exports from services
    ├── index.ts
    └── calculation.ts
```

---

## รายละเอียดไฟล์

### 📁 src/types/

| ไฟล์ | คำอธิบาย |
|------|----------|
| `player.ts` | Types สำหรับข้อมูลนักเตะ |
| `upgrade.ts` | Types สำหรับระบบตีบวก |
| `box.ts` | Types สำหรับระบบกล่อง |
| `ovr.ts` | Types สำหรับคำนวณ OVR |

### ⚙️ src/config/

| ไฟล์ | คำอธิบาย |
|------|----------|
| `app.config.ts` | ตั้งค่าหลักของแอพ |
| `upgrade.config.ts` | ตั้งค่าระบบตีบวก (อัตราลด, level ต่างๆ) |
| `box.config.ts` | ตั้งค่าระบบกล่อง (animation time, limits) |
| `api.config.ts` | ตั้งค่า API endpoints |

### 🎨 src/constants/

| ไฟล์ | คำอธิบาย |
|------|----------|
| `colors.ts` | สีทั้งหมด (level colors, rarity colors) |
| `messages.ts` | ข้อความ UI ทั้งหมด (ภาษาไทย) |
| `limits.ts` | ค่า limits ต่างๆ (min/max) |

### 🔧 src/services/

| ไฟล์ | คำอธิบาย |
|------|----------|
| `upgradeService.ts` | Logic ตีบวก (simulate, calculate rate) |
| `boxService.ts` | Logic เปิดกล่อง (open, format BP) |
| `ovrService.ts` | Logic คำนวณ OVR |
| `playerService.ts` | API calls สำหรับนักเตะ |

### 🪝 src/hooks/

| ไฟล์ | คำอธิบาย |
|------|----------|
| `useUpgradeSimulator.ts` | State management สำหรับ Upgrade Simulator |
| `useBoxSimulator.ts` | State management สำหรับ Box Simulator |
| `useOvrCalculator.ts` | State management สำหรับ OVR Calculator |
| `usePlayerSearch.ts` | Debounced player search |

---

## วิธีใช้งาน

### เพิ่มกล่องใหม่

แก้ไขไฟล์ `src/data/boxData.ts`:

```typescript
const NEW_BOX: BoxType = {
    id: 'new-box-jan-2026',
    name: 'กล่องใหม่ (Jan 2026)',
    description: 'รายละเอียด',
    icon: '/box/new.png',
    color: '#FF0000',
    valueUnit: 'bp',
    fcCost: 3000,
    rewards: [
        { id: 'reward-1', name: 'รางวัล 1', minValue: 100, maxValue: 1000, chance: 50, rarity: 'common' },
    ],
};

// เพิ่มเข้า ALL_BOXES
export const ALL_BOXES: BoxType[] = [
    BP_BOX_DEC_2025,
    CHAMPIONS_CHEST_DEC_2025,
    NEW_BOX,
];
```

### แก้ไขอัตราตีบวก

แก้ไขไฟล์ `src/data/upgradeChances.ts`:

```typescript
export const UPGRADE_DATA: UpgradeLevel[] = [
    { from: 1, to: 2, ovrGain: 1, totalOvr: 4, chance: 100 },
    { from: 2, to: 3, ovrGain: 1, totalOvr: 5, chance: 85 },
    // ...
];
```

### เปลี่ยนสีระดับตีบวก

แก้ไขไฟล์ `src/constants/colors.ts`:

```typescript
export const UPGRADE_LEVEL_COLORS: Record<number, string> = {
    1: '#6B7280',
    2: '#FF5500',  // เปลี่ยนสีบรอนซ์
    // ...
};
```

### เปลี่ยนข้อความ UI

แก้ไขไฟล์ `src/constants/messages.ts`:

```typescript
export const UPGRADE_MESSAGES = {
    success: 'สำเร็จแล้ว! 🎉',
    fail: 'พลาด ลองใหม่อีกครั้ง',
    // ...
};
```

### ปรับ Config

แก้ไขไฟล์ `src/config/upgrade.config.ts`:

```typescript
export const UPGRADE_CONFIG = {
    CATASTROPHIC_DROP_CHANCE: 5,
    UPGRADE_ANIMATION_DURATION: 1000,
    // ...
};
```

---

## Backward Compatibility

> **Note:** Code เดิมที่ import จาก `@/data/upgradeChances` หรือ `@/data/boxData` จะยังทำงานได้ปกติ เพราะมีการ re-export functions และ types ไว้

```typescript
// ทั้งสอง import นี้ใช้ได้
import { getLevelAfterFailure } from '@/data/upgradeChances';  // Old way
import { getLevelAfterFailure } from '@/services';              // New way (recommended)
```

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org)
- **Language:** TypeScript
- **Styling:** CSS

---

## Deploy

Deploy ด้วย [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new?utm_medium=default-template&filter=next.js)
