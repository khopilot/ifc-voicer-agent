# Agent Routing Test Plan for IFC Voice Assistant

## ✅ Agent Routing Configuration Summary

### 1. **Main Receptionist Agent** (`mainReceptionist`)
- **Role**: First point of contact, general inquiries
- **Transfers to**:
  - `courses` - When user asks about classes, learning, DELF/DALF
  - `events` - When user asks about activities, concerts, films
  - `cultural` - When user asks about scholarships, Campus France, studying in France

### 2. **Courses Agent** (`courses`)
- **Role**: French/Khmer language courses, certifications
- **Transfers to**:
  - `events` - If user asks about cultural activities
  - `cultural` - If user asks about scholarships/exchanges
  - `mainReceptionist` - For general questions

### 3. **Events Agent** (`events`)
- **Role**: Cultural events, cinema, exhibitions, concerts
- **Transfers to**:
  - `courses` - If user asks about classes
  - `cultural` - If user asks about Campus France
  - `mainReceptionist` - For general questions

### 4. **Cultural Agent** (`cultural`)
- **Role**: Campus France, scholarships, exchange programs
- **Transfers to**:
  - `courses` - If user asks about language classes
  - `events` - If user asks about activities
  - `mainReceptionist` - For general questions

## 🧪 Test Scenarios

### Test 1: French Language Course Inquiry
**Input**: "Je veux apprendre le français"
**Expected**: 
1. Main receptionist says: "Parfait! Je vous connecte avec notre expert pédagogique..."
2. Transfers to `courses` agent
3. Courses agent responds in French about available classes

### Test 2: English Event Query
**Input**: "What events are happening this week?"
**Expected**:
1. Main receptionist says: "Great! Our cultural coordinator will share..."
2. Transfers to `events` agent
3. Events agent responds in English about weekly activities

### Test 3: Khmer Scholarship Question
**Input**: "តើធ្វើយ៉ាងណាទៅសិក្សានៅបារាំង?"
**Expected**:
1. Main receptionist says: "អស្ចារ្យ! អ្នកប្រឹក្សា Campus France នឹងណែនាំលោកអ្នក។"
2. Transfers to `cultural` agent
3. Cultural agent responds in Khmer about studying in France

### Test 4: Cross-Domain Transfer
**Input to courses agent**: "What concerts are coming up?"
**Expected**:
1. Courses agent recognizes this is about events
2. Says brief handoff phrase
3. Transfers to `events` agent

### Test 5: Language Selector Impact
**Setup**: Select "KH" in language selector
**Input**: "Hello"
**Expected**:
1. Main receptionist responds with "សួស្តី!" (Khmer greeting)
2. Continues conversation in Khmer by default

## 🔍 Key Features to Verify

1. **Language Preservation**
   - Selected language (FR/KH/EN) persists across agent transfers
   - Agents respect `context.selectedLanguage` priority

2. **Handoff Phrases**
   - Each agent uses appropriate transition phrase before transfer
   - Phrase matches the current conversation language

3. **UI Updates**
   - Agent pills highlight correctly when handoff occurs
   - Transcript shows clear agent transitions

4. **Push-to-Talk**
   - Microphone stays muted by default
   - Only activates when button is held
   - Re-mutes when button is released

5. **Brief Greetings**
   - Agents say simple "Bonjour!"/"សួស្តី!"/"Hello!" on connection
   - Wait for user to speak first before offering help

## 🚀 Quick Test Commands

### French Course Test
"Bonjour, je cherche des cours de français niveau débutant"

### English Event Test  
"Hi, are there any film screenings this week?"

### Khmer Scholarship Test
"សួស្តី តើមានអាហារូបករណ៍សម្រាប់សិស្សខ្មែរទេ?"

### Mixed Language Test
Start in French: "Bonjour"
Then switch: "Can you speak English?"
Then ask: "What French classes do you offer?"

## ✅ Success Criteria

- [ ] All handoffs trigger correctly based on keywords
- [ ] Language preference is maintained across transfers
- [ ] UI reflects current active agent
- [ ] Push-to-talk works consistently
- [ ] Brief greetings without long introductions
- [ ] Context (user request) preserved during handoffs