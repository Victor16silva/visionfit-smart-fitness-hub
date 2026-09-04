"""Conteúdo demonstrativo; instruções educativas não substituem supervisão."""
EXERCISES = [
 ('Supino reto','Peito','Barra e banco','Deite no banco com os pés apoiados.|Segure a barra com punhos alinhados.|Desça de forma controlada e empurre sem perder o apoio.','Mantenha as escápulas apoiadas.','Rebater a barra no peito ou treinar sem segurança.','press'),
 ('Supino inclinado','Peito','Halteres e banco','Ajuste o banco em inclinação moderada.|Posicione os halteres ao lado do peito.|Empurre e retorne com controle.','Use amplitude confortável.','Arquear excessivamente a lombar.','press'),
 ('Crucifixo','Peito','Halteres','Deite e mantenha cotovelos levemente flexionados.|Abra os braços com controle.|Retorne sem bater os halteres.','Evite descer além de uma amplitude confortável.','Esticar totalmente os cotovelos.','fly'),
 ('Puxada frente','Costas','Polia alta','Ajuste o apoio das pernas.|Puxe a barra em direção à parte superior do peito.|Retorne com controle.','Mantenha o tronco estável.','Puxar a barra atrás do pescoço.','pull'),
 ('Remada curvada','Costas','Barra','Incline o tronco a partir do quadril.|Mantenha a coluna estável.|Puxe a barra em direção à cintura e retorne.','Comece com carga que permita estabilidade.','Arredondar a lombar ou balançar o corpo.','pull'),
 ('Remada baixa','Costas','Polia baixa','Sente com pés apoiados.|Puxe o pegador em direção ao abdômen.|Retorne sem perder o controle do tronco.','Conduza o movimento com os cotovelos.','Usar impulso com a lombar.','pull'),
 ('Desenvolvimento','Ombro','Halteres','Sente com apoio adequado.|Comece com halteres na altura dos ombros.|Empurre acima da cabeça e retorne lentamente.','Mantenha abdômen e tronco estáveis.','Exagerar no arco da coluna.','press'),
 ('Elevação lateral','Ombro','Halteres','Fique em pé com base firme.|Eleve os braços lateralmente até amplitude confortável.|Desça de forma controlada.','Use pouca carga para dominar a execução.','Balançar o tronco.','fly'),
 ('Rosca direta','Bíceps','Barra','Fique em pé com cotovelos próximos ao tronco.|Flexione os cotovelos.|Retorne lentamente.','Mantenha os punhos alinhados.','Usar impulso do quadril.','curl'),
 ('Rosca martelo','Bíceps','Halteres','Segure os halteres com as palmas voltadas uma para a outra.|Flexione os cotovelos.|Retorne com controle.','Mantenha os braços próximos ao corpo.','Mover os cotovelos para a frente.','curl'),
 ('Tríceps na polia','Tríceps','Polia e corda','Mantenha os cotovelos ao lado do corpo.|Estenda os braços sem travar agressivamente.|Retorne com controle.','Mantenha o tronco estável.','Usar todo o peso do corpo.','pull'),
 ('Tríceps francês','Tríceps','Halter','Segure o halter acima da cabeça.|Flexione os cotovelos com controle.|Estenda até posição confortável.','Escolha carga compatível com a amplitude.','Abrir excessivamente os cotovelos.','press'),
 ('Agachamento livre','Pernas','Barra e rack','Ajuste a barra e as travas de segurança.|Flexione quadris e joelhos mantendo pés apoiados.|Retorne com controle.','Use a amplitude adequada à sua mobilidade.','Perder o apoio dos pés.','squat'),
 ('Leg press','Pernas','Máquina','Apoie toda a região das costas.|Flexione os joelhos sem tirar o quadril do banco.|Empurre a plataforma com controle.','Mantenha joelhos alinhados aos pés.','Travar os joelhos com força.','squat'),
 ('Cadeira extensora','Pernas','Máquina','Ajuste o eixo da máquina ao joelho.|Estenda as pernas com controle.|Retorne lentamente.','Ajuste a máquina à sua altura.','Elevar o quadril do assento.','squat'),
 ('Mesa flexora','Pernas','Máquina','Ajuste os apoios conforme o equipamento.|Flexione os joelhos.|Retorne com controle.','Mantenha o quadril apoiado.','Elevar a lombar para mover a carga.','curl'),
 ('Elevação pélvica','Glúteos','Banco e barra','Apoie a região superior das costas no banco.|Eleve o quadril mantendo o tronco estável.|Retorne com controle.','Proteja o contato da barra com um apoio adequado.','Hiperestender a lombar no topo.','squat'),
 ('Abdução de quadril','Glúteos','Máquina','Ajuste assento e apoios.|Afaste as pernas com controle.|Retorne lentamente.','Evite compensações com o tronco.','Usar impulso.','fly'),
 ('Panturrilha em pé','Panturrilha','Máquina','Posicione os pés no apoio.|Eleve os calcanhares.|Desça de forma controlada.','Mantenha a amplitude confortável.','Fazer movimentos rápidos e sem controle.','squat'),
 ('Panturrilha sentado','Panturrilha','Máquina','Ajuste os apoios sobre as pernas.|Eleve os calcanhares.|Retorne lentamente.','Mantenha o apoio estável dos pés.','Balançar a carga.','squat'),
 ('Abdominal no solo','Abdômen','Colchonete','Deite com joelhos flexionados.|Eleve levemente a parte superior do tronco.|Retorne devagar.','Expire durante a subida.','Puxar o pescoço com as mãos.','curl'),
 ('Abdominal na polia','Abdômen','Polia e corda','Ajuste uma carga leve.|Flexione o tronco de forma controlada.|Retorne à posição inicial.','Evite puxar somente com os braços.','Exagerar na amplitude.','curl'),
 ('Bicicleta ergométrica','Cardio','Bicicleta','Ajuste a altura do banco.|Pedale em ritmo confortável.|Aumente o ritmo gradualmente se apropriado.','Use o campo de observações para duração e intensidade.','Começar com intensidade excessiva.','cycle'),
 ('Caminhada na esteira','Cardio','Esteira','Conheça o botão de parada.|Comece em velocidade confortável.|Caminhe com postura natural.','Use o campo de observações para registrar minutos.','Saltar da esteira em movimento.','cycle'),
 ('Stiff com halteres','Pernas','Halteres','Mantenha leve flexão dos joelhos.|Leve o quadril para trás com coluna estável.|Retorne à posição inicial.','Desça apenas até manter a estabilidade.','Arredondar a coluna.','squat'),
 ('Flexão de braços','Peito','Peso corporal','Apoie mãos e pés ou joelhos.|Flexione os cotovelos mantendo o corpo alinhado.|Empurre o chão com controle.','Escolha uma variação adequada ao seu nível.','Deixar o quadril cair.','press')
]
WORKOUTS = [
 ('Treino A','Peito + Tríceps',0,[(1,4,10,40),(2,3,12,16),(3,3,12,10),(11,3,12,20),(12,3,10,10)]),
 ('Treino B','Costas + Bíceps',1,[(4,4,10,40),(5,3,10,30),(6,3,12,35),(9,3,12,15),(10,3,12,10)]),
 ('Treino C','Pernas + Glúteos',2,[(13,4,10,40),(14,3,12,80),(15,3,12,30),(16,3,12,25),(17,3,12,40)]),
 ('Treino D','Ombros + Abdômen',3,[(7,4,10,14),(8,3,12,8),(21,3,15,0),(22,3,12,15)]),
 ('Treino E','Posterior + Panturrilha',4,[(25,4,10,20),(16,3,12,25),(18,3,15,30),(19,4,15,25),(20,3,15,20)])
]
ACHIEVEMENTS = [
 ('first','Primeiro passo','Conclua seu primeiro treino.',1,'total',100),
 ('ten','Disciplina de ouro','Conclua 10 treinos.',10,'total',200),
 ('fifty','Em outro nível','Conclua 50 treinos.',50,'total',500),
 ('hundred','Centurião','Conclua 100 treinos.',100,'total',1000),
 ('fivehundred','Lenda ATHEV','Conclua 500 treinos.',500,'total',3000),
 ('streak7','Ritmo constante','Registre atividade em 7 dias consecutivos.',7,'streak',250),
 ('streak30','Constância absoluta','Registre atividade em 30 dias consecutivos.',30,'streak',1000),
 ('record','Além do limite','Registre seu primeiro recorde pessoal.',1,'records',150)
]
