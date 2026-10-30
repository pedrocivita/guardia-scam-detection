import { RiskLevel, type RiskReport } from '../types';

export type ScenarioId = 'bank' | 'delivery' | 'pix';

export interface DemoFlag {
  phrase: string;
  category: string;
}

export interface DemoLine {
  speaker: 'caller' | 'user';
  text: string;
  score: number;
  flags: DemoFlag[];
  note: string;
}

export interface DemoScenario {
  id: ScenarioId;
  title: string;
  lines: DemoLine[];
  closing: string;
  verdict: {
    score: number;
    reason: string;
    actions: string[];
  };
}

export const SCENARIOS: DemoScenario[] = [
  {
    id: 'bank',
    title: 'Bank security',
    lines: [
      {
        speaker: 'caller',
        text: 'Hello, this is the security desk at your bank. We just blocked a card charge of 4,800 in another city.',
        score: 3.4,
        flags: [
          { phrase: 'security desk', category: 'Impersonation' },
          { phrase: 'blocked a card charge', category: 'Unsolicited alert' },
        ],
        note: 'A stranger opens by claiming to be the bank, with a charge you did not make.',
      },
      {
        speaker: 'user',
        text: 'I did not make that charge. Is my card blocked now?',
        score: 3.6,
        flags: [],
        note: 'Answering keeps the script moving. The caller wants you to stay unsure.',
      },
      {
        speaker: 'caller',
        text: 'Yes. To lift the block, read me the six digit code from the text we sent, and the password for your banking app.',
        score: 7.8,
        flags: [
          { phrase: 'six digit code', category: 'One-time code' },
          { phrase: 'password for your banking app', category: 'Credential theft' },
        ],
        note: 'A real bank does not ask for an app password or a one-time code on a call they placed.',
      },
      {
        speaker: 'user',
        text: 'I have never given that password over the phone.',
        score: 7.8,
        flags: [],
        note: 'That hesitation is right. The next line will try to rush you past it.',
      },
      {
        speaker: 'caller',
        text: 'You have two minutes before the account is frozen and sent to collections. Stay on this call. Do not hang up, and do not call the number on your card.',
        score: 9.6,
        flags: [
          { phrase: 'two minutes', category: 'Urgency' },
          { phrase: 'Do not hang up', category: 'Isolation' },
          { phrase: 'do not call the number on your card', category: 'Isolation' },
        ],
        note: 'A countdown, plus a warning not to reach the real bank, is the close of a theft script.',
      },
    ],
    closing: 'GUARD.IA says hang up. Do not read the code or the password.',
    verdict: {
      score: 9.6,
      reason: 'The caller pretends to be bank security, asks for a one-time code and the app password, then tries to stop you from hanging up or calling the number on your card. That is credential theft, not a fraud desk.',
      actions: [
        'Hang up now.',
        'Do not read any code or password.',
        'Call the bank using the number on the back of your card.',
        'If you already shared a code, freeze the card in the official app.',
      ],
    },
  },
  {
    id: 'delivery',
    title: 'Delivery fee',
    lines: [
      {
        speaker: 'caller',
        text: 'Delivery desk here. Your parcel is held at the depot because a shipping fee of 19.90 was not paid.',
        score: 3.2,
        flags: [{ phrase: 'shipping fee', category: 'Unexpected payment' }],
        note: 'An unexpected fee on a call you did not place is the bait. The amount is small on purpose.',
      },
      {
        speaker: 'user',
        text: 'I already paid for shipping when I ordered it.',
        score: 3.2,
        flags: [],
        note: 'A real carrier can be checked in the order itself. The caller will not want that.',
      },
      {
        speaker: 'caller',
        text: 'The driver is downstairs with the box. Pay the fee in the next few minutes or it goes back today and a penalty is added.',
        score: 6.4,
        flags: [
          { phrase: 'driver is downstairs', category: 'False urgency' },
          { phrase: 'penalty is added', category: 'Pressure' },
        ],
        note: 'A driver who cannot wait, and a penalty, are there to stop you from checking the shop app.',
      },
      {
        speaker: 'user',
        text: 'Can I pay on the carrier website?',
        score: 6.4,
        flags: [],
        note: 'Asking for the official site is the right move. A scam call will refuse it.',
      },
      {
        speaker: 'caller',
        text: 'The site will not work for this hold. Read me the card number, the expiry date, and the three digits on the back so I can release the driver.',
        score: 9.4,
        flags: [
          { phrase: 'card number', category: 'Card theft' },
          { phrase: 'three digits on the back', category: 'Card theft' },
        ],
        note: 'The fee was never the goal. The card number and the security code are.',
      },
    ],
    closing: 'GUARD.IA says hang up. Do not read your card numbers.',
    verdict: {
      score: 9.4,
      reason: 'A small unpaid fee and a driver who is supposedly waiting are the bait. The request for the full card number and the three digits on the back is the theft. Carriers do not collect card details on an unexpected call.',
      actions: [
        'Hang up.',
        'Do not read card numbers or security codes.',
        'Check the order in the shop app you actually used.',
        'Report the number as a scam in your phone.',
      ],
    },
  },
  {
    id: 'pix',
    title: 'Pix urgency',
    lines: [
      {
        speaker: 'caller',
        text: 'We detected a Pix of 2,350 to a key you have never used. If you did not send it, we can reverse it, but only from this call.',
        score: 4.8,
        flags: [
          { phrase: 'Pix of 2,350', category: 'Unexpected transfer' },
          { phrase: 'only from this call', category: 'Isolation' },
        ],
        note: 'A Pix you do not recognize is frightening. "Only from this call" is meant to keep you away from the bank.',
      },
      {
        speaker: 'user',
        text: 'I did not send a Pix. Please cancel it.',
        score: 5,
        flags: [],
        note: 'You can ask the bank to check. You do not have to do it through this caller.',
      },
      {
        speaker: 'caller',
        text: 'Open your bank app and send a verification Pix to the safety key I will dictate. The money returns to you in five minutes and that proves you own the account.',
        score: 8.6,
        flags: [
          { phrase: 'verification Pix', category: 'Reverse payment' },
          { phrase: 'safety key', category: 'Drop account' },
        ],
        note: 'A verification Pix is not a banking procedure. The safety key is the caller\'s account.',
      },
      {
        speaker: 'user',
        text: 'Why would I send money to prove the account is mine?',
        score: 8.6,
        flags: [],
        note: 'That question breaks the script. The caller will now add a deadline.',
      },
      {
        speaker: 'caller',
        text: 'The reversal window closes in sixty seconds. Stay on the line. If you call the bank yourself, the reversal fails and the Pix is gone.',
        score: 9.7,
        flags: [
          { phrase: 'sixty seconds', category: 'Urgency' },
          { phrase: 'If you call the bank yourself', category: 'Isolation' },
        ],
        note: 'The countdown and the ban on calling your bank are there so you pay before you can check.',
      },
    ],
    closing: 'GUARD.IA says do not send the Pix. Hang up and open the bank app yourself.',
    verdict: {
      score: 9.7,
      reason: 'Nobody needs a new Pix from you to reverse a Pix. The safety key belongs to the caller. The sixty second window, and the warning not to call your bank, exist so you send the money before you can look.',
      actions: [
        'Do not send a Pix.',
        'Hang up and open the bank app yourself.',
        'Confirm the balance in the official app, or call the number on your card.',
        'A verification Pix is not a real banking step.',
      ],
    },
  },
];

export function scenarioById(id: ScenarioId): DemoScenario {
  const found = SCENARIOS.find((item) => item.id === id);
  if (!found) return SCENARIOS[0];
  return found;
}

export function levelFor(score: number): RiskLevel {
  if (score >= 8) return RiskLevel.HIGH;
  if (score >= 5) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
}

export function sentimentFor(score: number): NonNullable<RiskReport['sentiment']> {
  if (score >= 8) return { primary: 'Urgent', intensity: 88, scoreAdjustment: 2 };
  if (score >= 5) return { primary: 'Pressured', intensity: 62, scoreAdjustment: 1 };
  return { primary: 'Calm', intensity: 18, scoreAdjustment: 0 };
}

export const IDLE_REPORT: RiskReport = {
  score: 1,
  level: RiskLevel.LOW,
  reason: 'Press play. A fake bank security call runs first. Nothing is sent to a server.',
  actions: [],
  detections: [],
  sentiment: sentimentFor(1),
};
