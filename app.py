
import os
import json
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify
from flask_cors import CORS
from google.generativeai import GoogleGenAI
from dotenv import load_dotenv

# Carrega as chaves do arquivo .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# ==============================================================================
# [CONFIGURAÇÃO COMERCIAL] - ONDE ALTERAR VALORES NO FUTURO
# ==============================================================================

# 1. MARGEM DE LUCRO: 1.20 significa 20% de acréscimo sobre o custo total.
# Ex: Para 50% de lucro, mude para 1.50
MARGEM_LUCRO = 1.20 

# 2. TAXA DE MODELAGEM: Valor cobrado extra se o cliente NÃO tiver o arquivo .STL
TAXA_MODELAGEM = 25.0

# 3. SEU E-MAIL PESSOAL: Onde você quer receber os alertas de novos pedidos
EMAIL_DESTINO = "matheusc.alves@hotmail.com"

# 4. CONFIGURAÇÃO DO SERVIDOR DE E-MAIL (SMTP)
# Se usar Gmail: "smtp.gmail.com" | Se usar Outlook/Hotmail: "smtp.office365.com"
SMTP_SERVER = "smtp.office365.com"
SMTP_PORT = 587

# ==============================================================================

# Inicialização da IA Gemini
# A chave API deve estar no arquivo .env como API_KEY
ai = GoogleGenAI(apiKey=os.getenv("API_KEY") or "")

def load_json(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def select_machine(tamanho, material, machines):
    """
    [REGRA DE ESCOLHA DA IMPRESSORA]
    Altere aqui se comprar máquinas novas ou quiser mudar o limite de tamanho.
    """
    material_upper = material.upper()
    
    # Se a peça for pequena (<= 15cm) e não for material que exige fechamento (ABS)
    if tamanho <= 15 and material_upper != "ABS":
        return next((m for m in machines if "A1 Mini" in m['nome']), machines[0])
    else:
        # Para peças grandes ou materiais técnicos
        return next((m for m in machines if "K2 Plus" in m['nome']), machines[-1])

def calculate_machine_hour_cost(machine):
    """
    [CÁLCULO DE DEPRECIAÇÃO]
    Baseado no investimento / vida útil definida no machines.json
    """
    return machine['custo_investimento'] / machine['vida_util_horas']

def send_detailed_email(data, estimate, machine_info):
    """
    [ENVIO DE E-MAIL]
    Envia os detalhes do orçamento para o seu e-mail pessoal.
    """
    # As credenciais são lidas do arquivo .env por segurança
    sender_email = os.getenv("EMAIL_USER")
    sender_password = os.getenv("EMAIL_PASS")

    if not sender_email or not sender_password:
        print("ERRO: Credenciais de e-mail não configuradas no arquivo .env")
        return False

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = EMAIL_DESTINO
    msg['Subject'] = f"🚀 NOVO ORÇAMENTO: {data['nome']} ({machine_info['nome']})"

    corpo_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e2e8f0; padding: 25px; border-radius: 15px;">
        <h2 style="color: #2563eb; margin-top: 0;">Novo Orçamento Gerado</h2>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Cliente:</strong> {data['nome']}</p>
            <p style="margin: 5px 0;"><strong>E-mail:</strong> {data['email']}</p>
            <p style="margin: 5px 0;"><strong>WhatsApp:</strong> {data.get('telefone', 'N/A')}</p>
        </div>

        <h3 style="color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Detalhes de Produção</h3>
        <p><strong>Máquina Selecionada:</strong> {machine_info['nome']}</p>
        <p><strong>Custo/Hora Operacional:</strong> R$ {machine_info['custo_hora']:.2f}</p>
        <p><strong>Tempo Estimado pela IA:</strong> {estimate['tempo_estimado_h']} horas</p>

        <h3 style="color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Informações da Peça</h3>
        <p><strong>Tipo:</strong> {data['tipo']} | <strong>Material:</strong> {data['material']}</p>
        <p><strong>Peso:</strong> {data['peso_g']}g | <strong>Tamanho:</strong> {data['tamanho_cm']}cm</p>

        <div style="background: #eff6ff; border: 1px solid #dbeafe; padding: 20px; border-radius: 12px; margin-top: 25px; text-align: center;">
            <p style="margin: 0; color: #1e40af; font-weight: bold; font-size: 14px; text-transform: uppercase;">Valor Estimado na Tela do Cliente:</p>
            <h2 style="margin: 10px 0; color: #1d4ed8; font-size: 28px;">R$ {estimate['valorMin']:.2f} - R$ {estimate['valorMax']:.2f}</h2>
            <p style="margin: 0; font-size: 11px; color: #60a5fa;">Custo Base: R$ {estimate['valor_base_similares']:.2f} + Máquina: R$ {estimate['custo_total_maquina']:.2f}</p>
        </div>
        
        <p style="font-size: 10px; color: #94a3b8; margin-top: 30px; text-align: center;">Gerado em {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</p>
    </div>
    """
    msg.attach(MIMEText(corpo_html, 'html'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"ERRO AO ENVIAR E-MAIL: {e}")
        return False

@app.route('/api/estimate', methods=['POST'])
async def estimate_similarity():
    data = request.json
    db = load_json('database.json')
    machines = load_json('machines.json')
    
    # 1. Escolha automática da máquina
    machine = select_machine(data['tamanho_cm'], data['material'], machines)
    custo_hora_maquina = calculate_machine_hour_cost(machine)
    
    # 2. Prompt para o Gemini analisar similaridade
    prompt = f"""
    Como especialista em 3D, analise estas peças anteriores: {json.dumps(db)}
    Estime para este novo pedido: {json.dumps(data)}
    
    RETORNE APENAS JSON:
    {{
      "valor_base_similares": float, 
      "tempo_estimado_h": float, 
      "justificativa": "string"
    }}
    """
    
    try:
        response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { "responseMimeType": "application/json" }
        })
        
        res_ia = json.loads(response.text)
        
        # 3. Cálculo Final do Preço
        custo_total_maquina = res_ia['tempo_estimado_h'] * custo_hora_maquina
        valor_custo_total = res_ia['valor_base_similares'] + custo_total_maquina
        
        # Taxa de modelagem caso não tenha arquivo pronto
        if not data['possuiSTL']:
            valor_custo_total += TAXA_MODELAGEM
            
        estimate = {
            "valorMin": valor_custo_total,
            "valorMax": valor_custo_total * MARGEM_LUCRO,
            "tempo_estimado_h": res_ia['tempo_estimado_h'],
            "valor_base_similares": res_ia['valor_base_similares'],
            "custo_total_maquina": custo_total_maquina,
            "justificativa": f"Utilizando a {machine['nome']}. " + res_ia['justificativa']
        }
        
        # Envia e-mail para Matheus
        machine_info = {"nome": machine['nome'], "custo_hora": custo_hora_maquina}
        email_ok = send_detailed_email(data, estimate, machine_info)
        
        return jsonify({**estimate, "notificado": email_ok})
        
    except Exception as e:
        print(f"ERRO NO PROCESSAMENTO: {e}")
        return jsonify({"error": "Erro ao calcular orçamento. Verifique se a API Key está correta."}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
