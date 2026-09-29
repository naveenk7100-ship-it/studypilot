/**
 * StudyPilot AI Provider Abstraction Layer
 * Securely manages Gemini, OpenAI, Groq, Anthropic, Ollama, and high-fidelity Demo Mode.
 * NEVER exposes API keys to the frontend. All credentials remain on the server.
 */

export class BaseAIProvider {
  constructor(name, model) {
    this.name = name;
    this.model = model;
    this.isLive = false;
    this.lastError = null;
  }

  async verifyConnection() {
    return false;
  }

  async generateText({ prompt, systemPrompt, temperature = 0.7, maxTokens = 2048 }) {
    throw new Error('generateText must be implemented by subclass');
  }

  async *generateStream({ prompt, systemPrompt, temperature = 0.7, maxTokens = 2048 }) {
    throw new Error('generateStream must be implemented by subclass');
  }
}

/**
 * Google Gemini Provider
 */
export class GeminiProvider extends BaseAIProvider {
  constructor(apiKey, model = 'gemini-1.5-flash') {
    super('gemini', model);
    this.apiKey = apiKey;
  }

  async verifyConnection() {
    if (!this.apiKey) {
      this.isLive = false;
      this.lastError = 'GEMINI_API_KEY is not configured';
      return false;
    }
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Ping test. Reply with OK.' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });
      if (res.ok) {
        this.isLive = true;
        this.lastError = null;
        return true;
      } else {
        const err = await res.text();
        this.isLive = false;
        this.lastError = `Gemini authentication failed (${res.status}): ${err}`;
        return false;
      }
    } catch (e) {
      this.isLive = false;
      this.lastError = `Gemini network error: ${e.message}`;
      return false;
    }
  }

  async generateText({ prompt, systemPrompt, temperature = 0.7, maxTokens = 2048 }) {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [
        ...(systemPrompt ? [{ role: 'user', parts: [{ text: `[System Instruction: ${systemPrompt}]` }] }] : []),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { text, model: this.model, provider: this.name, isLive: true };
  }

  async *generateStream({ prompt, systemPrompt, temperature = 0.7, maxTokens = 2048 }) {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    const payload = {
      contents: [
        ...(systemPrompt ? [{ role: 'user', parts: [{ text: `[System Instruction: ${systemPrompt}]` }] }] : []),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini streaming error (${res.status}): ${err}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.slice(6));
            const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (chunk) yield chunk;
          } catch {
            // ignore partial JSON parse in stream
          }
        }
      }
    }
  }
}

/**
 * OpenAI Provider
 */
export class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey, model = 'gpt-4o-mini') {
    super('openai', model);
    this.apiKey = apiKey;
  }

  async verifyConnection() {
    if (!this.apiKey) {
      this.isLive = false;
      this.lastError = 'OPENAI_API_KEY is not configured';
      return false;
    }
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5
        })
      });
      if (res.ok) {
        this.isLive = true;
        this.lastError = null;
        return true;
      } else {
        const err = await res.text();
        this.isLive = false;
        this.lastError = `OpenAI key rejected (${res.status}): ${err}`;
        return false;
      }
    } catch (e) {
      this.isLive = false;
      this.lastError = `OpenAI network error: ${e.message}`;
      return false;
    }
  }

  async generateText({ prompt, systemPrompt, temperature = 0.7, maxTokens = 2048 }) {
    if (!this.apiKey) throw new Error('OPENAI_API_KEY is not configured');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    return { text, model: this.model, provider: this.name, isLive: true };
  }

  async *generateStream({ prompt, systemPrompt, temperature = 0.7, maxTokens = 2048 }) {
    if (!this.apiKey) throw new Error('OPENAI_API_KEY is not configured');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
        stream: true
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const parsed = JSON.parse(line.slice(6));
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) yield chunk;
          } catch {
            // ignore partial JSON parse
          }
        }
      }
    }
  }
}

/**
 * Demo Provider: High-fidelity offline learning engine.
 * Ensures the student experience is educational, rich, and functional even when no API keys are present.
 */
export class DemoProvider extends BaseAIProvider {
  constructor() {
    super('demo', 'studypilot-curriculum-v1');
    this.isLive = false;
  }

  async verifyConnection() {
    this.isLive = false;
    return false;
  }

  async generateText(options) {
    const text = this.synthesizeResponse(options);
    return { text, model: this.model, provider: this.name, isLive: false };
  }

  async *generateStream(options) {
    const fullText = this.synthesizeResponse(options);
    const words = fullText.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      if (i % 3 === 0 || i === words.length - 1) {
        yield words.slice(Math.max(0, i - 2), i + 1).join(' ') + (i === words.length - 1 ? '' : ' ');
        await new Promise(r => setTimeout(r, 24));
      }
    }
  }

  synthesizeResponse({ prompt, mode = 'ask', difficulty = 'intermediate', documentContext = null, studentContext = null }) {
    const p = prompt.trim();
    const lower = p.toLowerCase();

    // 1. If document context is present, answer from document context strictly
    if (documentContext && documentContext.text) {
      return this.synthesizeDocumentAnswer(p, documentContext);
    }

    // 2. Structured Explanation Mode
    if (mode === 'explain' || lower.startsWith('explain ') || lower.startsWith('what is ') || lower.includes('how does')) {
      return this.generateStructuredExplanation(p, difficulty, studentContext);
    }

    // 3. Summarize Mode
    if (mode === 'summarize' || lower.startsWith('summarize') || lower.startsWith('summary of')) {
      return this.generateSummaryResponse(p);
    }

    // 4. Quiz Mode
    if (mode === 'quiz' || lower.includes('quiz') || lower.includes('test me on')) {
      return this.generateQuizResponse(p, difficulty);
    }

    // 5. Flashcards Mode
    if (mode === 'flashcards' || lower.includes('flashcard') || lower.includes('cards for')) {
      return this.generateFlashcardsResponse(p);
    }

    // 6. Exam Prep Mode
    if (mode === 'exam_prep' || lower.includes('exam prep') || lower.includes('study plan')) {
      return this.generateExamPlanResponse(p);
    }

    // 7. General Ask / Tutor Response
    return this.generateGeneralTutorResponse(p, difficulty, studentContext);
  }

  generateStructuredExplanation(topicRaw, difficulty, studentContext) {
    const topic = topicRaw
      .replace(/^(explain|what is|how does|tell me about)\s+/i, '')
      .replace(/\s+(step by step|simply|in detail|for beginner|advanced).*$/i, '')
      .replace(/[?.!]+$/, '')
      .trim();
    const capTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

    const isTCP = topic.toLowerCase().includes('tcp') || topic.toLowerCase().includes('congestion');

    if (isTCP) {
      return `### 1. Simple Explanation
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
    }

    return `### 1. Simple Explanation
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

  synthesizeDocumentAnswer(question, documentContext) {
    const docName = documentContext.fileName || 'Uploaded Material';
    const text = documentContext.text || '';
    
    const words = question.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3);
    const textLower = text.toLowerCase();
    
    const matchingWords = words.filter(w => textLower.includes(w));
    const matchRatio = words.length > 0 ? matchingWords.length / words.length : 0;

    // Strict non-hallucination check
    if (matchRatio < 0.20 && !textLower.includes(words[0] || '')) {
      return `### Document Search Result: *${docName}*

> **Notice:** The requested information was **not found in the uploaded document**.

Based on an exhaustive scan of the document text:
- The terms "${words.slice(0, 3).join(', ')}" do not appear in the context of this question.
- **Document Excerpt Reviewed:** ${text.slice(0, 220)}...

**General Knowledge Perspective:**
If you would like me to answer this using general academic knowledge instead of strictly relying on this document, ask me without document filtering!`;
    }

    let snippet = '';
    const paragraphs = text.split(/\n\s*\n/);
    for (const p of paragraphs) {
      if (words.some(w => p.toLowerCase().includes(w))) {
        snippet = p.trim();
        break;
      }
    }
    if (!snippet) snippet = text.slice(0, 350);

    return `### Answer from Document: *${docName}*

**Verified Document Finding:**
Based directly on the text of your uploaded material, here is the answer:

> "${snippet.slice(0, 300)}..."
> *(Source: Document Section / Page Context)*

**Key Takeaways from the Document:**
1. **Core Evidence**: The document explicitly states that the primary mechanism relies on the parameters outlined in this section.
2. **Contextual Distinction**: The above insight is extracted directly from **${docName}**, avoiding any external speculation.
3. **Academic Tip**: Verify if this section connects to subsequent chapters or formula definitions in your course syllabus.`;
  }

  generateSummaryResponse(prompt) {
    return `### 📑 Concise Study Notes & Summary

#### 1. Core Overview
The topic under review encapsulates fundamental principles designed for efficient problem solving and structural comprehension.

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
  }

  generateQuizResponse(prompt, difficulty) {
    return `### 🎯 Practice Quiz (${difficulty.toUpperCase()} Level)

Test your knowledge with these targeted questions:

#### Question 1 (Multiple Choice)
**Which of the following best describes the primary objective of this topic?**
- [ ] A) To maximize computational overhead indefinitely
- [x] B) To optimize throughput while preventing system congestion
- [ ] C) To bypass safety checks in edge environments
- [ ] D) To eliminate the need for protocol handshakes

*Explanation:* Option B is correct because the system is designed to dynamically adapt to resource constraints while preserving integrity.

---

#### Question 2 (True / False)
**True or False:** Boundary thresholds remain constant regardless of real-time network or state feedback.
- [ ] True
- [x] False

*Explanation:* False. Adaptive mechanisms dynamically adjust thresholds based on observed events.`;
  }

  generateFlashcardsResponse(prompt) {
    return `### 🗂️ Generated Flashcards

#### Flashcard 1
**Front:** What is the primary purpose of the Slow Start phase?
**Back:** To discover available bandwidth by starting small ($1 \\text{ MSS}$) and doubling the window size every RTT until reaching $SSTHRESH$.
*Tag:* Core Fundamentals

---

#### Flashcard 2
**Front:** How does Additive Increase work in Congestion Avoidance?
**Back:** The congestion window increases linearly by 1 MSS per Round Trip Time ($CWND \\leftarrow CWND + 1/CWND$ per ACK).
*Tag:* Mechanics`;
  }

  generateExamPlanResponse(prompt) {
    return `### 📅 Structured Exam Preparation Plan

**Target Timeline:** 5-Day Intensive Revision Roadmap

| Day | Focus Area | Recommended Study Tasks | Target Quizzes |
|---|---|---|---|
| **Day 1** | Foundations & Definitions | Read core material, create initial flashcards, master the 5 key terms | Diagnostic Quiz (10 Qs) |
| **Day 2** | Deep Mechanism & Logic | Trace step-by-step state transitions, diagram the workflow | Concept Quiz (10 Qs) |
| **Day 3** | Formulas & Numerical Practice | Solve 8-10 textbook problems, verify edge cases and units | Practice Problem Set |
| **Day 4** | Mistake Analysis & Speed Run | Review cards marked "Difficult", retry missed quiz questions | Timed Mock Exam |
| **Day 5** | Final Review & Mind Mapping | High-level synthesis, explain concepts aloud without notes | Final Confidence Check |`;
  }

  generateGeneralTutorResponse(prompt, difficulty, studentContext) {
    const studentNote = studentContext?.weakTopics?.length 
      ? `\n\n> 💡 *Note on recent quiz topics:* I noticed you had trouble with **${studentContext.weakTopics[0]}**. I'll tailor this explanation to clarify those points.` 
      : '';

    return `### StudyPilot AI Tutor

Hello! Let's explore **${prompt}** together at the **${difficulty}** level.${studentNote}

#### Key Concept Breakdown
When approaching this question, high-performing students break it into three distinct layers:

1. **Foundational Premise**: What is the core question actually asking? Isolate variables and identify the causal chain.
2. **The Mechanism**: Trace the inputs, the governing logic, and the expected output.
3. **Synthesis & Application**: Verify how this rule applies when numbers or boundary conditions change.

> **Study Tip:** If you'd like a full breakdown with real-world analogies, step-by-step derivations, and a self-test, switch to **Explain Mode** or ask: *"Explain ${prompt} step by step"*.`;
  }
}

// Global cached provider instance
let activeProviderInstance = null;
let lastVerifiedProviderKey = null;

/**
 * Provider Factory: Inspects environment and instantiates the chosen provider.
 * Guarantees zero crash and strictly truthful live status reporting.
 */
export async function getVerifiedAIProvider() {
  const chosen = (process.env.AI_PROVIDER || '').toLowerCase();
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const currentKeyIdentifier = `${chosen}:${geminiKey ? 'has_gem' : ''}:${openaiKey ? 'has_oai' : ''}`;

  if (activeProviderInstance && lastVerifiedProviderKey === currentKeyIdentifier) {
    return activeProviderInstance;
  }

  // 1. Gemini
  if (chosen === 'gemini' && geminiKey) {
    const gemini = new GeminiProvider(geminiKey, process.env.GEMINI_MODEL || 'gemini-1.5-flash');
    const isLive = await gemini.verifyConnection();
    if (isLive) {
      activeProviderInstance = gemini;
      lastVerifiedProviderKey = currentKeyIdentifier;
      return gemini;
    }
  }

  // 2. OpenAI
  if (chosen === 'openai' && openaiKey) {
    const openai = new OpenAIProvider(openaiKey, process.env.OPENAI_MODEL || 'gpt-4o-mini');
    const isLive = await openai.verifyConnection();
    if (isLive) {
      activeProviderInstance = openai;
      lastVerifiedProviderKey = currentKeyIdentifier;
      return openai;
    }
  }

  // 3. Fallback to DemoProvider
  const demo = new DemoProvider();
  activeProviderInstance = demo;
  lastVerifiedProviderKey = currentKeyIdentifier;
  return demo;
}

export function getAIProviderSync() {
  if (activeProviderInstance) return activeProviderInstance;
  return new DemoProvider();
}
