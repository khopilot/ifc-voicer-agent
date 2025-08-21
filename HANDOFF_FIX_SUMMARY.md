# 🔄 Correction des Handoffs - Institut français du Cambodge

## 🐛 Problème Identifié
Les agents ne parvenaient pas à faire les transitions (handoffs) entre eux. Quand l'agent principal disait "Je vais vous passer notre spécialiste", rien ne se passait.

## ✅ Solutions Appliquées

### 1. **Configuration des Handoffs Circulaires**
```typescript
// Ajout des handoffs APRÈS la création pour éviter les dépendances circulaires
(mainReceptionistAgent.handoffs as any).push(coursesAgent, eventsAgent, culturalAgent);
(coursesAgent.handoffs as any).push(mainReceptionistAgent);
(eventsAgent.handoffs as any).push(mainReceptionistAgent);
(culturalAgent.handoffs as any).push(mainReceptionistAgent);
```

### 2. **Instructions de Handoff Explicites**
Chaque agent a maintenant des instructions claires pour les transitions :

**Agent Principal (mainReceptionist):**
- Cours → "transfer to courses"
- Événements → "transfer to events"
- Échanges → "transfer to cultural"

**Agents Spécialisés:**
- Retour à l'accueil → "transfer to mainReceptionist"
- Redirection entre spécialistes selon les besoins

### 3. **Structure des Instructions**
```typescript
HANDOFF INSTRUCTIONS:
- When the user asks about [TOPIC], say "[PHRASE]" and transfer to [AGENT_NAME]
```

## 📋 Agents Configurés

1. **mainReceptionist** - Accueil général trilingue
2. **courses** - Conseiller pédagogique (cours FR/KH)
3. **events** - Coordinateur événements culturels
4. **cultural** - Conseiller échanges et Campus France

## 🔍 Comment Tester

### Test 1: Cours
```
User: "Bonjour, quels cours de français proposez-vous ?"
Expected: L'agent principal transfère vers l'agent courses
```

### Test 2: Événements
```
User: "Quelles sont les activités cette semaine ?"
Expected: L'agent principal transfère vers l'agent events
```

### Test 3: Retour
```
User (à l'agent courses): "Merci, j'ai une autre question générale"
Expected: L'agent courses retransfère vers mainReceptionist
```

## ⚠️ Points d'Attention

1. **Noms d'Agents**: Les noms dans les instructions doivent correspondre EXACTEMENT aux noms définis
2. **Références Circulaires**: Utiliser le pattern push() après création
3. **Langue**: Les agents doivent maintenir la langue de l'utilisateur lors des transitions

## 🚀 État Actuel
- ✅ Configuration des handoffs corrigée
- ✅ Instructions multilingues ajoutées
- ✅ Références circulaires résolues
- ✅ Pattern de handoff aligné avec les exemples OpenAI

## 📝 Notes Techniques

Le système OpenAI Agents utilise un événement `agent_handoff` qui est déclenché quand un agent veut transférer à un autre. Le hook `useRealtimeSession` écoute cet événement et met à jour l'agent actif via le callback `onAgentHandoff`.

Les handoffs fonctionnent mieux quand :
- Les agents sont dans le même tableau `scenario`
- Les références sont ajoutées après création
- Les instructions mentionnent explicitement "transfer to [agent_name]"