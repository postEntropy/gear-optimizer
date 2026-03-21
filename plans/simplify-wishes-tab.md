# Simplificar Aba de Wishes

O objetivo é tornar a aba de **Wishes** mais amigável (User Friendly), escondendo detalhes técnicos em seções expansíveis e focando no que o usuário realmente quer ver: quais desejos estão ativos, quanto tempo falta e o que eles custam.

## Mudanças Propostas

### 1. Configurações de Recursos (Energy, Magic, R3)
Atualmente, existem 3 blocos grandes de Power/Cap/Use que ocupam muito espaço vertical.
- **Mudança**: Mover esses blocos para um `Accordion` chamado "Configurações de Recursos e Modificadores".
- **Compactação**: Dentro do Accordion, usar uma `Grid` para mostrar os valores de forma mais densa.

### 2. Cards de Wishes
Em vez de uma lista simples de campos de texto, cada Wish terá seu próprio `Card`.
- **Cabeçalho**: Nome do Wish (Dropdown).
- **Conteúdo**:
    - Nível Inicial e Objetivo lado a lado.
    - **Destaque Visual**: Tempo estimado para completar o Wish (ex: "Termina em 05:20:00").
    - **Requisitos de Recursos**: Pequenos indicadores com as quantidades de E, M e R necessárias.

### 3. Resumo de Resultados
- Consolidar a mensagem "After XX:XX:XX all targets will be reached" em um banner de destaque no topo ou no final.
- Esconder a tabela de "True Time Estimation" (tempo na prática) atrás de um toggle ou dentro de um Accordion de "Análise Avançada".
- Tornar os campos de "Spare Resources" mais compactos.

### 4. Melhorias de UX
- Adicionar botões rápidos para "Maximizar Nível" ou "Zerar Nível".
- Usar ícones (Energy: ⚡, Magic: ✨, R3: 🔋) para facilitar a leitura rápida.

## Arquivos Afetados
- `src/components/Content/Wishes.js`: Refatoração total do layout.

## Passos de Implementação
1. Importar componentes do MUI (`Accordion`, `Card`, `Typography`, etc.).
2. Reestruturar o `render()` do `Wishes.js` para usar esses novos elementos.
3. Adicionar lógica de exibição de tempo nos Cards.
4. Testar a interface com diferentes quantidades de slots.
