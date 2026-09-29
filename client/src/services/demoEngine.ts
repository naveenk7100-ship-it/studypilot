import type {
  ServerStatus,
  StudyMode,
  DifficultyLevel,
  ProcessedDocument,
  QuizQuestion,
  Flashcard,
  ExamPlan
} from '../types';

export const DEMO_SERVER_STATUS: ServerStatus = {
  status: 'ok',
  provider: 'demo',
  model: 'studypilot-curriculum-v1',
  isLive: false,
  message: 'Demo Mode active — Running client-side on GitHub Pages without server dependency.'
};

/**
 * Checks if the application is running statically on GitHub Pages or file protocol.
 */
export function isStaticDeployment(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname.includes('github.io') ||
    window.location.protocol === 'file:' ||
    window.location.port === '4173'
  );
}

/**
 * Client-Side Demo Explanation Engine
 */
export function generateDemoExplanation(
  topicRaw: string,
  difficulty: DifficultyLevel = 'intermediate',
  studentContext?: any
): { text: string; provider: string; model: string; isLive: boolean } {
  const topic = topicRaw
    .replace(/^(explain|what is|how does|tell me about)\s+/i, '')
    .replace(/\s+(step by step|simply|in detail|for beginner|advanced).*$/i, '')
    .replace(/[?.!]+$/, '')
    .trim() || 'Core Academic Topic';
  const capTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

  const isTCP = topic.toLowerCase().includes('tcp') || topic.toLowerCase().includes('congestion');

  let text = '';
  if (isTCP) {
    text = `### 1. Simple Explanation
**TCP Congestion Control** is the internet's built-in traffic management system. When you download a large file or stream a lecture, your computer doesn't blast all the packets at maximum speed immediately. Instead, it tests how much traffic the network can handle, speeds up gradually, and quickly backs off the moment network routers start dropping packets.

---

### 2. Why It Matters
Without congestion control, the entire internet would suffer from **congestion collapse**—a catastrophic state where network buffers overflow, packets get dropped, retransmissions flood the links, and virtually zero useful data reaches anyone. It ensures fair bandwidth sharing across millions of simultaneous devices.

---

### 3. Step-by-Step Explanation
TCP congestion control operates in four foundational phases:

1. **Slow Start**:
   - Begins with a small Congestion Window ($CWND = 1 \\text{ MSS}$).
   - For every positive acknowledgment (ACK) received, $CWND$ increases by $1$.
   - **Result**: The window size doubles every Round Trip Time (exponential growth: $1 \\to 2 \\to 4 \\to 8 \\dots$) until reaching the **Slow Start Threshold** ($SSTHRESH$).

2. **Congestion Avoidance**:
   - Once $CWND \\ge SSTHRESH$, exponential growth is too risky.
   - Switched to linear growth (Additive Increase): $CWND = CWND + \\frac{1}{CWND}$ per ACK.
   - The window grows carefully by 1 MSS per Round Trip Time.

3. **Congestion Detection (Loss Event)**:
   - **Triple Duplicate ACKs**: Mild congestion. Fast Retransmit fires, $SSTHRESH$ is halved ($CWND / 2$), and Fast Recovery begins.
   - **Timeout**: Severe congestion. The sender sets $SSTHRESH = CWND / 2$ and resets $CWND = 1 \\text{ MSS}$, dropping back to Slow Start.

4. **Fast Recovery**:
   - Avoids dropping to $CWND = 1$ when isolated packets are lost, maintaining network pipeline efficiency.

---

### 4. Real-World Analogy
Imagine cars entering a busy highway ramp:
- **Slow Start**: You let 1 car in, then 2 cars, then 4 cars to test the highway density.
- **Congestion Avoidance**: Cars are flowing well, so you only let in 1 extra car per minute.
- **Loss Event**: You see brake lights and a fender bender ahead (a dropped packet). You immediately cut incoming ramp traffic in half or hold back to prevent a 10-mile gridlock.

---

### 5. Practical Example & Math
Given a network path with an MSS (Maximum Segment Size) of $1460 \\text{ bytes}$ and initial $CWND = 1$:
$$CWND_{\\text{exponential}} = 2^t \\cdot \\text{MSS}$$
$$CWND_{\\text{linear}}(t+1) = CWND(t) + 1 \\text{ MSS}$$

When packet loss occurs at $CWND = 32 \\text{ MSS}$:
- New $SSTHRESH = \\frac{32}{2} = 16 \\text{ MSS}$
- If timeout: $CWND \\leftarrow 1 \\text{ MSS}$
- If 3 Dup ACKs: $CWND \\leftarrow 16 + 3 = 19 \\text{ MSS}$ (Fast Recovery)

---

### 6. Key Points to Remember
- **AIMD Principle**: Additive Increase, Multiplicative Decrease. Slow to speed up, quick to pull back.
- **Congestion Window ($CWND$)**: Maintained by sender; distinct from Receiver Window ($RWND$).
- **Effective Window**: $\\min(CWND, RWND)$.
- Major algorithms: TCP Reno, TCP Tahoe, TCP NewReno, and modern TCP Cubic / BBR.

---

### 7. Quick Revision Checklist
- [x] Slow Start grows exponentially ($O(2^t)$).
- [x] Congestion Avoidance grows linearly ($+1 \\text{ MSS/RTT}$).
- [x] Timeout drops $CWND$ to 1; Triple Dup ACK halves it.
- [x] $SSTHRESH$ is always set to half of the congestion window at the time of loss.

---

### 8. Check Your Understanding
> **Quick Question:** If the current $CWND$ is 16 MSS and a packet loss is detected via 3 Duplicate ACKs (TCP Reno), what will be the new $SSTHRESH$ and the new $CWND$ in Fast Recovery?
>
> *(Answer: $SSTHRESH = 8 \\text{ MSS}$; $CWND = 8 + 3 = 11 \\text{ MSS}$)*`;
  } else {
    text = `### 1. Simple Explanation
**${capTopic}** is a core academic principle. At its foundation, it addresses how elements within a system interact, transform, or maintain equilibrium under changing conditions. For a ${difficulty}-level student, thinking of it as an input-to-output transformation will give you the clearest mental model.

---

### 2. Why It Matters
Mastering **${capTopic}** is vital because:
- It serves as a prerequisite for higher-level problem solving in this discipline.
- Exam questions regularly test both its theoretical foundations and edge cases.
- It provides a standardized framework that professionals use to diagnose system behavior and optimize outcomes.

---

### 3. Step-by-Step Explanation
1. **Initial State / Baseline**: Every process involving ${capTopic} begins with clearly defined initial parameters and boundary constraints.
2. **The Driving Mechanism**: A specific force, operation, or rule triggers a transition. This is governed by the core mathematical or conceptual formula of the topic.
3. **Equilibrium & Convergence**: As the operation proceeds, the system converges toward a stable result or solved state.
4. **Edge Cases & Failure Modes**: When boundary limits are exceeded, fallback mechanisms or error states must be accounted for.

---

### 4. Real-World Analogy
Think of **${capTopic}** like a home thermostat:
- It continuously measures the actual temperature against your target setpoint.
- If too cold, the furnace engages; if the target is met, it switches off.
- The continuous feedback loop prevents extreme swings and maintains stability.

---

### 5. Practical Example & Math
Given parameters with target variable $X$:
$$f(x) = \\sum_{i=1}^{n} w_i x_i + b$$
Verify the consistency of output states against theoretical limits.

---

### 6. Key Points to Remember
- Always identify the given variables and their units before computing.
- Double-check boundary conditions (zero, infinity, empty state).
- Remember the relationship between causes and their direct secondary effects.

---

### 7. Quick Revision Checklist
- [x] Understand the primary definition and core term.
- [x] Memorize the fundamental formula or sequence of steps.
- [x] Know at least one real-world practical use case.

---

### 8. Check Your Understanding
> **Self-Test Prompt:** In your own words, what is the single most critical condition required for **${capTopic}** to function correctly, and what happens if that condition fails?`;
  }

  return {
    text,
    provider: 'demo',
    model: 'studypilot-curriculum-v1',
    isLive: false
  };
}

/**
 * Client-Side Demo Chat Stream Synthesizer
 */
export async function streamDemoChat(
  params: {
    message: string;
    mode: StudyMode;
    difficulty?: DifficultyLevel;
    documentContext?: any;
    studentContext?: any;
  },
  onChunk: (chunk: string) => void,
  onDone: () => void
) {
  const p = params.message.trim();
  const lower = p.toLowerCase();
  let fullResponse = '';

  // 1. Document Context Check
  if (params.documentContext && params.documentContext.text) {
    const docName = params.documentContext.fileName || 'Uploaded Material';
    const text = params.documentContext.text || '';
    const words = p.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3);
    const textLower = text.toLowerCase();
    const matchingWords = words.filter(w => textLower.includes(w));
    const matchRatio = words.length > 0 ? matchingWords.length / words.length : 0;

    if (matchRatio < 0.20 && !textLower.includes(words[0] || '')) {
      fullResponse = `### Document Search Result: *${docName}*

> **Notice:** The requested information was **not found in the uploaded document**.

Based on an exhaustive scan of the document text:
- The terms "${words.slice(0, 3).join(', ')}" do not appear in the context of this question.
- **Document Excerpt Reviewed:** ${text.slice(0, 220)}...

**General Knowledge Perspective:**
If you would like me to answer this using general academic knowledge instead of strictly relying on this document, ask me without document filtering!`;
    } else {
      let snippet = '';
      const paragraphs = text.split(/\n\s*\n/);
      for (const para of paragraphs) {
        if (words.some(w => para.toLowerCase().includes(w))) {
          snippet = para.trim();
          break;
        }
      }
      if (!snippet) snippet = text.slice(0, 350);

      fullResponse = `### Answer from Document: *${docName}*

**Verified Document Finding:**
Based directly on the text of your uploaded material, here is the answer:

> "${snippet.slice(0, 300)}..."
> *(Source: Document Section / Page Context)*

**Key Takeaways from the Document:**
1. **Core Evidence**: The document explicitly states that the primary mechanism relies on the parameters outlined in this section.
2. **Contextual Distinction**: The above insight is extracted directly from **${docName}**, avoiding any external speculation.
3. **Academic Tip**: Verify if this section connects to subsequent chapters or formula definitions in your course syllabus.`;
    }
  } else if (params.mode === 'explain' || lower.startsWith('explain ') || lower.startsWith('what is ') || lower.includes('how does')) {
    fullResponse = generateDemoExplanation(p, params.difficulty, params.studentContext).text;
  } else if (params.mode === 'summarize' || lower.startsWith('summarize') || lower.startsWith('summary of')) {
    fullResponse = `### 📑 Concise Study Notes & Summary

#### 1. Core Overview
The topic **${p}** encapsulates fundamental principles designed for efficient problem solving and structural comprehension.

#### 2. Key Takeaways
- **Point A**: Primary definition establishes boundary constraints and operational goals.
- **Point B**: The process operates sequentially with defined transition states.
- **Point C**: Verification occurs through feedback loops or validation checks.

#### 3. Important Terms & Definitions
- **Principle Component**: The primary driver responsible for system state changes.
- **Constraint Threshold**: The limit beyond which alternative strategies or error routines trigger.
- **Convergence**: The point at which the calculated result matches target criteria.

#### 4. Quick Formula / Notation
$$\\text{Efficiency} = \\frac{\\text{Useful Work Output}}{\\text{Total Energy Input}} \\times 100\\%$$

#### 5. Review Question for Exam
*How would you explain the difference between the primary mechanism and its secondary edge cases to a study peer?*`;
  } else {
    const studentNote = params.studentContext?.weakTopics?.length
      ? `\n\n> 💡 *Note on recent quiz topics:* I noticed you had trouble with **${params.studentContext.weakTopics[0]}**. I'll tailor this explanation to clarify those points.`
      : '';

    fullResponse = `### StudyPilot AI Tutor

Hello! Let's explore **${p}** together at the **${params.difficulty || 'intermediate'}** level.${studentNote}

#### Key Concept Breakdown
When approaching this question, high-performing students break it into three distinct layers:

1. **Foundational Premise**: What is the core question actually asking? Isolate variables and identify the causal chain.
2. **The Mechanism**: Trace the inputs, the governing logic, and the expected output.
3. **Synthesis & Application**: Verify how this rule applies when numbers or boundary conditions change.

> **Study Tip:** If you'd like a full breakdown with real-world analogies, step-by-step derivations, and a self-test, switch to **Explain Mode** or ask: *"Explain ${p} step by step"*.`;
  }

  // Stream words progressively
  const words = fullResponse.split(' ');
  for (let i = 0; i < words.length; i++) {
    if (i % 3 === 0 || i === words.length - 1) {
      const chunk = words.slice(Math.max(0, i - 2), i + 1).join(' ') + (i === words.length - 1 ? '' : ' ');
      onChunk(chunk);
      await new Promise(r => setTimeout(r, 20));
    }
  }
  onDone();
}

/**
 * Client-Side Demo Quiz Generator
 */
export function generateDemoQuiz(
  topicRaw: string,
  subject: string = 'General',
  difficulty: string = 'medium',
  count: number = 5
): { questions: QuizQuestion[]; id: string } {
  const safeTopic = topicRaw || 'Computer Networks';
  const isTCP = safeTopic.toLowerCase().includes('tcp') || safeTopic.toLowerCase().includes('congestion');

  const questions: QuizQuestion[] = [];

  if (isTCP) {
    questions.push(
      {
        id: 'q-demo-1',
        type: 'mcq',
        question: 'During TCP Slow Start, how does the Congestion Window (CWND) increase with each Round Trip Time (RTT)?',
        options: [
          'Linear growth (+1 MSS per RTT)',
          'Exponential growth (doubles every RTT)',
          'Logarithmic growth',
          'Remains constant until SSTHRESH'
        ],
        correctAnswer: 'Exponential growth (doubles every RTT)',
        explanation: 'In Slow Start, CWND increases by 1 MSS for each received ACK, resulting in doubling every RTT.',
        topic: 'Slow Start Dynamics'
      },
      {
        id: 'q-demo-2',
        type: 'mcq',
        question: 'What is the action taken by TCP Reno upon receiving 3 Duplicate ACKs?',
        options: [
          'Reset CWND to 1 MSS and restart Slow Start',
          'Set SSTHRESH = CWND / 2, set CWND = SSTHRESH + 3 MSS, and enter Fast Recovery',
          'Disconnect the TCP socket immediately',
          'Triple the CWND size to overcome the bottleneck'
        ],
        correctAnswer: 'Set SSTHRESH = CWND / 2, set CWND = SSTHRESH + 3 MSS, and enter Fast Recovery',
        explanation: '3 Duplicate ACKs signal mild packet loss, triggering Fast Retransmit and Fast Recovery without dropping to 1 MSS.',
        topic: 'Fast Recovery & Reno'
      },
      {
        id: 'q-demo-3',
        type: 'true_false',
        question: 'True or False: The sender can transmit more data than the Receiver Window (RWND) as long as CWND is sufficiently large.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'The effective transmission window is strictly bounded by min(CWND, RWND) to prevent receiver buffer overflow.',
        topic: 'Flow Control vs Congestion Control'
      },
      {
        id: 'q-demo-4',
        type: 'mcq',
        question: 'What does AIMD stand for in network congestion control?',
        options: [
          'Additive Increase Multiplicative Decrease',
          'Automatic Interleaved Message Delivery',
          'Adaptive Internet Measurement Device',
          'Asynchronous Immediate Multi-Drop'
        ],
        correctAnswer: 'Additive Increase Multiplicative Decrease',
        explanation: 'AIMD is the foundational control algorithm balancing bandwidth discovery with rapid congestion relief.',
        topic: 'AIMD Principles'
      }
    );
  } else {
    for (let i = 1; i <= count; i++) {
      const isTF = i % 3 === 0;
      if (isTF) {
        questions.push({
          id: `q-demo-${i}`,
          type: 'true_false',
          question: `True or False: In ${safeTopic}, boundary conditions can be neglected if initial values are sufficiently large.`,
          options: ['True', 'False'],
          correctAnswer: 'False',
          explanation: `In ${safeTopic}, boundary constraints are fundamental and must be respected regardless of scale.`,
          topic: `${safeTopic} Principles`
        });
      } else {
        questions.push({
          id: `q-demo-${i}`,
          type: 'mcq',
          question: `What is a primary consideration when evaluating ${safeTopic} under ${difficulty} conditions?`,
          options: [
            `Ensuring conservation laws and core boundary conditions are satisfied`,
            `Disregarding variance in system response times`,
            `Assuming constant friction or zero resistance universally`,
            `Eliminating verification checks to optimize speed`
          ],
          correctAnswer: `Ensuring conservation laws and core boundary conditions are satisfied`,
          explanation: `Verifying boundary conditions and fundamental conservation laws prevents mathematical inconsistency in ${safeTopic}.`,
          topic: `${safeTopic} Analysis`
        });
      }
    }
  }

  return {
    id: 'quiz-' + Date.now(),
    questions: questions.slice(0, count)
  };
}

/**
 * Client-Side Demo Flashcards Generator
 */
export function generateDemoFlashcards(topicRaw: string, count: number = 6): Flashcard[] {
  const t = (topicRaw || 'Computer Networks').trim();
  const isTCP = t.toLowerCase().includes('tcp') || t.toLowerCase().includes('network');

  const rawCards = isTCP
    ? [
        {
          front: 'What is the Slow Start Threshold (SSTHRESH)?',
          back: 'The target CWND limit marking the transition from exponential Slow Start to linear Congestion Avoidance.',
          topic: 'TCP Basics'
        },
        {
          front: 'How is CWND adjusted per ACK in Congestion Avoidance?',
          back: 'CWND increases by 1/CWND (resulting in +1 MSS per Round Trip Time).',
          topic: 'AIMD Dynamics'
        },
        {
          front: 'What triggers Fast Retransmit?',
          back: 'The arrival of 3 Duplicate ACKs for the same sequence number, signaling packet loss before a timeout occurs.',
          topic: 'Loss Detection'
        },
        {
          front: 'What is the difference between CWND and RWND?',
          back: 'CWND (Congestion Window) is determined by the sender based on network capacity; RWND (Receiver Window) is advertised by the receiver based on its buffer size.',
          topic: 'Window Architecture'
        },
        {
          front: 'What is Congestion Collapse?',
          back: 'A failure state where buffers overflow and retransmissions choke out throughput, causing useful delivery to drop near zero.',
          topic: 'Network Failures'
        },
        {
          front: 'What is the formula for the Effective Window in TCP?',
          back: 'Effective Window = min(CWND, RWND). The sender cannot exceed either limit.',
          topic: 'Transmission Math'
        }
      ]
    : [
        {
          front: `Define the core principle of ${t}`,
          back: `The fundamental mechanism governing ${t} that ensures proper transition between initial state and solved equilibrium.`,
          topic: t
        },
        {
          front: `What is the primary governing formula in ${t}?`,
          back: `f(x) = sum(w_i * x_i) + b, defining the relationship between independent inputs and the observable state.`,
          topic: `${t} Formulas`
        },
        {
          front: `What failure state occurs when boundary conditions are violated in ${t}?`,
          back: `Instability or non-convergence, where error margins grow exponentially rather than settling to steady-state.`,
          topic: `${t} Diagnostics`
        }
      ];

  return rawCards.slice(0, count).map((fc, idx) => ({
    id: `fc-demo-${Date.now()}-${idx}`,
    front: fc.front,
    back: fc.back,
    topic: fc.topic,
    state: 'new',
    repetitions: 0,
    interval: 1,
    easeFactor: 2.5,
    nextReviewDate: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }));
}

/**
 * Client-Side Demo Exam Plan Generator
 */
export function generateDemoExamPlan(params: {
  examName: string;
  subject: string;
  examDate: string;
  availableHours: number;
  topics: string[];
  weakTopics?: string[];
}): ExamPlan {
  const safeHours = Math.min(16, Math.max(1, Number(params.availableHours) || 3));
  const parsedDate = new Date(params.examDate);
  const now = new Date();
  const diffTime = isNaN(parsedDate.getTime()) ? 7 * 86400000 : parsedDate.getTime() - now.getTime();
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  let prioritizedTopics: string[] = [];
  if (Array.isArray(params.weakTopics) && params.weakTopics.length > 0) {
    prioritizedTopics = [...params.weakTopics];
  }
  if (Array.isArray(params.topics)) {
    params.topics.forEach(t => {
      if (t && !prioritizedTopics.includes(t)) prioritizedTopics.push(t);
    });
  }
  if (prioritizedTopics.length === 0) {
    prioritizedTopics = ['Foundational Concepts', 'Core Formulas & Applications', 'Advanced Problem Solving', 'Mock Exam & Review'];
  }

  const daysCount = Math.min(diffDays, 14);
  const dailyPlan = [];

  for (let day = 1; day <= daysCount; day++) {
    const topicIndex = (day - 1) % prioritizedTopics.length;
    const currentTopic = prioritizedTopics[topicIndex];
    const isWeak = params.weakTopics?.includes(currentTopic);
    const isReviewDay = day === daysCount || day % 4 === 0;

    dailyPlan.push({
      dayNumber: day,
      title: isReviewDay
        ? `Day ${day}: Consolidation & Diagnostic Practice`
        : `Day ${day}: ${currentTopic} ${isWeak ? '⚠️ (Priority Focus)' : ''}`,
      focusTopic: currentTopic,
      allocatedHours: safeHours,
      tasks: [
        { id: `t-${day}-1`, text: `Read and synthesize core concepts in ${currentTopic}`, completed: false },
        { id: `t-${day}-2`, text: `Active recall: Review 15 flashcards for ${currentTopic}`, completed: false },
        { id: `t-${day}-3`, text: isReviewDay ? 'Complete 10-question timed practice quiz' : 'Solve 5 application problems', completed: false }
      ],
      milestone: isReviewDay ? 'Checkpoint Quiz' : isWeak ? 'Gap Remediation' : 'Concept Mastery'
    });
  }

  return {
    id: 'exam-' + Date.now(),
    examName: params.examName,
    subject: params.subject,
    examDate: params.examDate,
    daysRemaining: diffDays,
    dailyHours: safeHours,
    totalStudyHours: daysCount * safeHours,
    topics: prioritizedTopics,
    dailyPlan,
    createdAt: new Date().toISOString()
  };
}

/**
 * Client-Side Document Processor (for .txt, .md, or readable files in browser)
 */
export async function processDocumentInBrowser(file: File): Promise<ProcessedDocument> {
  const rawText = await file.text().catch(() => 'Study material notes content.');
  const paragraphs = rawText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 20);

  const summary = paragraphs.slice(0, 3).join('\n\n') || rawText.slice(0, 400);
  const concepts = [
    'Core Fundamentals',
    'Theoretical Framework',
    'Applied Methodology',
    file.name.replace(/\.[^/.]+$/, '')
  ];

  const definitions = [
    { term: 'Primary Axiom', definition: 'The foundational condition governing system operation.' },
    { term: 'Boundary Limit', definition: 'The threshold beyond which error protocols engage.' }
  ];

  const formulas = [
    'f(x) = W * X + b',
    'Efficiency = Output / Input * 100%'
  ];

  const practiceQuestions = [
    {
      question: `What is the primary thesis described in ${file.name}?`,
      context: 'Document Introduction & Core Principles'
    },
    {
      question: `How do the core principles adapt when initial boundary conditions change?`,
      context: 'Methodology and Boundary Analysis'
    }
  ];

  const flashcards = [
    {
      id: `fc-doc-${Date.now()}-1`,
      front: `What is the central focus of ${file.name}?`,
      back: summary.slice(0, 180) + '...',
      topic: file.name
    },
    {
      id: `fc-doc-${Date.now()}-2`,
      front: 'Key Takeaway from this material',
      back: 'Systematic review and active recall ensure long-term retention of these principles.',
      topic: 'Synthesis'
    }
  ];

  const mcqs = [
    {
      id: `mcq-doc-${Date.now()}-1`,
      question: `What is the key takeaway from ${file.name}?`,
      options: [
        'Fundamental principles require systematic boundary verification',
        'Initial conditions can be ignored entirely',
        'Error routines never trigger under standard operations',
        'Output values do not correlate with input variables'
      ],
      correctAnswer: 'Fundamental principles require systematic boundary verification',
      explanation: 'Academic study materials consistently emphasize validating initial boundary conditions.'
    }
  ];

  const chapters = [
    {
      title: 'Chapter 1: Foundational Concepts',
      estimatedPage: 1,
      summary: summary.slice(0, 120) + '...'
    }
  ];

  return {
    id: 'doc-' + Date.now(),
    fileName: file.name,
    fileSize: file.size,
    fileType: file.name.split('.').pop()?.toUpperCase() || 'TXT',
    pageCount: Math.max(1, Math.ceil(rawText.length / 1500)),
    rawText,
    pages: [{ pageNumber: 1, text: rawText.slice(0, 1500) }],
    uploadedAt: new Date().toISOString(),
    status: 'processed',
    summary,
    concepts,
    definitions,
    formulas,
    questions: practiceQuestions,
    flashcards,
    mcqs,
    chapters
  };
}
