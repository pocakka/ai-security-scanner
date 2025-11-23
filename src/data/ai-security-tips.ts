/**
 * AI Red Teaming Security Tips
 *
 * Educational tips displayed during scan loading to inform users about
 * AI security risks, vulnerabilities, and best practices.
 */

export const AI_SECURITY_TIPS = [
  // OWASP LLM Top 10 Risks
  "Prompt injection attacks can manipulate AI responses by embedding malicious instructions in user input.",
  "Over-reliance on AI outputs without human verification can lead to critical security decisions based on hallucinated information.",
  "Training data poisoning can compromise AI models by injecting malicious patterns during the learning phase.",
  "Model denial-of-service attacks can exhaust resources by sending computationally expensive prompts.",
  "Supply chain vulnerabilities in AI systems often come from third-party models or datasets with unknown security postures.",
  "Insecure plugin design allows AI agents to access sensitive systems without proper authorization checks.",
  "Sensitive information disclosure happens when AI models reveal training data through carefully crafted queries.",
  "Excessive agency in AI systems can lead to autonomous actions that violate security policies.",
  "Model inversion attacks can reconstruct training data by analyzing model outputs and behaviors.",
  "Inadequate AI output sanitization enables cross-site scripting (XSS) when AI-generated content is rendered without validation.",

  // API Key Security
  "API keys exposed in client-side JavaScript are instantly compromised and can be scraped by automated bots.",
  "A single exposed OpenAI API key can cost thousands of dollars in hours if abused for crypto mining prompts.",
  "Regenerating API keys immediately after exposure is critical—waiting even minutes can result in unauthorized usage.",
  "Rate limiting on AI APIs should be implemented at both the application and provider level for defense in depth.",
  "API keys should never be committed to version control, even in private repositories.",
  "Environment variables are only secure when the server environment itself is properly secured.",
  "Browser DevTools can easily reveal API keys if they're included in network requests from the frontend.",
  "Service accounts with minimal required permissions reduce damage from compromised credentials.",
  "Rotating API keys regularly (every 90 days) limits exposure window if keys are silently compromised.",
  "Monitoring API usage patterns can detect anomalies indicating stolen credentials before major damage occurs.",

  // Prompt Injection & Jailbreaking
  "Jailbreak attacks use psychological manipulation to convince AI models to ignore safety guidelines.",
  "Indirect prompt injection embeds malicious instructions in external data sources the AI retrieves.",
  "Multi-turn attacks build trust over several interactions before introducing malicious prompts.",
  "System prompt leakage reveals internal instructions that attackers can use to craft better attacks.",
  "Delimiter confusion attacks exploit inconsistent parsing of special characters in prompts.",
  "Role-playing scenarios are commonly used to make AI models violate content policies.",
  "Translation-based bypasses use non-English languages to evade English-centric safety filters.",
  "Embedding attacks hide malicious instructions in whitespace, unicode, or encoded text.",
  "Chain-of-thought manipulation tricks models into justifying harmful outputs through reasoning steps.",
  "Payload splitting distributes malicious instructions across multiple prompts to avoid detection.",

  // Data Privacy & Compliance
  "AI models trained on user data may inadvertently memorize and reveal personal information.",
  "GDPR's right to deletion conflicts with immutable training data in deployed AI models.",
  "Federated learning can leak information through model weight updates despite not sharing raw data.",
  "Differential privacy adds noise to training data but reduces model accuracy—balance is crucial.",
  "Data minimization principles require collecting only AI-essential information, not everything available.",
  "AI processing of biometric data (face recognition, voice) requires explicit consent under most regulations.",
  "Cross-border data transfers for AI training may violate data sovereignty laws in multiple jurisdictions.",
  "Audit logs of AI decisions must be retained for compliance but also increase attack surface.",
  "Children's data has stricter protections (COPPA, GDPR-K) requiring additional AI safeguards.",
  "Right to explanation means AI decisions must be interpretable, limiting use of black-box models.",

  // Model Security & Architecture
  "Adversarial examples exploit model blind spots—images with imperceptible noise causing misclassification.",
  "Model extraction attacks clone proprietary models by querying them repeatedly with carefully chosen inputs.",
  "Backdoor attacks embed hidden triggers in models that activate under specific conditions.",
  "Model watermarking embeds identifiable patterns to prove ownership and detect unauthorized copies.",
  "Ensemble models using multiple AI systems are more resilient but also more complex to secure.",
  "Homomorphic encryption allows computation on encrypted data but is currently too slow for real-time AI.",
  "Trusted execution environments (TEEs) protect model weights during inference but add performance overhead.",
  "Quantization and pruning reduce model size but can also amplify existing biases and vulnerabilities.",
  "Zero-knowledge proofs can verify AI computations without revealing model internals.",
  "Secure multi-party computation enables collaborative AI training without exposing individual datasets.",

  // Detection & Monitoring
  "Anomaly detection on AI outputs can catch drift before it causes security incidents.",
  "Red teaming exercises should test both technical vulnerabilities and social engineering vectors.",
  "Canary tokens in training data detect if models are exfiltrated or misused.",
  "A/B testing security controls helps measure effectiveness without disrupting production services.",
  "Shadow AI refers to unapproved AI tools employees use, creating unmonitored security gaps.",
  "Behavioral analytics on API calls can distinguish legitimate users from automated abuse.",
  "Honeypot prompts designed to detect reconnaissance can alert security teams early.",
  "Version control for AI models enables rapid rollback if vulnerabilities are discovered post-deployment."
]

/**
 * Get a random AI security tip
 */
export function getRandomSecurityTip(): string {
  return AI_SECURITY_TIPS[Math.floor(Math.random() * AI_SECURITY_TIPS.length)]
}
