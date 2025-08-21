# 🧪 Testing Guide - Optimized IFC Agents

## Quick Test Scenarios

### 🇫🇷 Test French Language Flow
1. **Start**: "Bonjour, je voudrais apprendre le français"
   - **Expected**: Receptionist detects French, offers to transfer to courses agent
   - **Handoff**: Smooth transfer with French continuity

2. **Courses**: Ask about DELF B2 preparation
   - **Expected**: Detailed course info, schedule, pricing in French

3. **Cross-sell**: Ask about cultural events
   - **Expected**: Transfer to events agent, maintains French

### 🇰🇭 Test Khmer Language Flow
1. **Start**: "សួស្តី ខ្ញុំចង់រៀនភាសាបារាំង"
   - **Expected**: Response in Khmer with proper honorifics
   - **Transfer**: To courses agent in Khmer

2. **Scholarship**: "តើមានអាហារូបករណ៍ទេ?"
   - **Expected**: Transfer to cultural agent for Campus France info

### 🇬🇧 Test English Flow
1. **Start**: "Hello, what events do you have this week?"
   - **Expected**: Direct transfer to events agent
   - **Events**: Detailed weekly calendar in English

### 🔄 Test Language Switching
1. Start in French: "Bonjour!"
2. Switch to English: "Actually, can we continue in English?"
3. **Expected**: Smooth transition, acknowledgment

### 🎯 Test Intent Recognition
1. **Vague**: "I want to learn something"
   - **Expected**: Clarifying questions about courses vs events

2. **Specific**: "DELF B2 exam preparation"
   - **Expected**: Immediate transfer to courses agent

3. **Multiple**: "I want French classes and to study in France"
   - **Expected**: Prioritizes immediate need (courses), mentions Campus France

### 🤝 Test Handoff Quality
1. **Context Preservation**: 
   - Tell reception: "I'm a beginner, work evenings"
   - Transfer to courses
   - **Expected**: Courses agent recommends morning/weekend classes

2. **Circular Handoff**:
   - Start with courses
   - Ask about events
   - Ask about scholarships
   - Return to courses
   - **Expected**: Smooth transitions without repetition

### 📊 Performance Indicators

✅ **Success Metrics**:
- Language detected within first response
- Appropriate cultural greetings
- Handoff completed in one exchange
- Context preserved across agents
- No language mixing unless requested

⚠️ **Watch for Issues**:
- Language detection failures
- Lost context during handoff
- Repetitive information
- Cultural inappropriateness
- Slow response times

### 🎭 Cultural Sensitivity Tests

**Khmer Interaction**:
- Elderly person scenario
- **Expected**: Extra respectful language, "លោកតា/លោកយាយ"

**French Formal**:
- Professional inquiry
- **Expected**: "Vous" form maintained

**Time-Based Greetings**:
- Test at different times
- **Expected**: Morning/afternoon/evening variations

## 📝 Test Checklist

- [ ] French language detection and response
- [ ] Khmer language with proper honorifics
- [ ] English professional tone
- [ ] Courses agent detailed information
- [ ] Events agent enthusiasm
- [ ] Cultural agent scholarship knowledge
- [ ] Smooth handoffs between all agents
- [ ] Context preservation
- [ ] Time-aware greetings
- [ ] Error recovery

## 🚀 Advanced Testing

### Stress Test
1. Mix languages in one sentence
2. Ask about multiple topics rapidly
3. Request unavailable services
4. Test boundary cases

### Quality Assurance
1. Verify pricing accuracy
2. Check schedule consistency
3. Validate contact information
4. Confirm handoff phrases

---

**Remember**: The optimized agents should feel like knowledgeable, culturally-aware staff members of Institut français du Cambodge, not generic chatbots!