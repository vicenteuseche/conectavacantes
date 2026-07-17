#!/usr/bin/env python
# Script para modificar el endpoint index en api/index.py

index_html = '''<!DOCTYPE html>
<html lang="es" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ConectaVacantes - Encuentra empleo remoto</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-background text-foreground font-sans antialiased">
    <div id="root" class="flex flex-col min-h-screen">
        <header class="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <div class="container mx-auto px-4 py-4 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <svg class="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/>
                        <path d="M17 11l-5 5-5-5"/>
                    </svg>
                    <h1 class="text-xl font-semibold text-foreground">ConectaVacantes</h1>
                </div>
                <nav class="flex items-center space-x-4">
                    <a href="/" class="text-sm text-primary">Inicio</a>
                    <button onclick="document.getElementById('auth-modal').classList.remove('hidden')" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Iniciar Sesión Obligatorio</button>
                </nav>
            </div>
        </header>
        
        <main class="flex-1">
            <section class="container mx-auto px-4 py-20">
                <div class="max-w-4xl mx-auto text-center">
                    <h2 class="text-4xl md:text-5xl font-bold text-foreground mb-4">Bienvenido a ConectaVacantes</h2>
                    <p class="text-lg text-muted-foreground mb-8">Encuentra tu trabajo remoto ideal usando inteligencia artificial.<br><strong class="text-primary">El acceso es obligatorio mediante autenticación.</strong></p>
                    
                    <div class="mb-12">
                        <h3 class="text-xl font-semibold text-foreground mb-6">Tu proceso de búsqueda en 4 pasos</h3>
                        <div class="flex flex-col md:flex-row justify-center items-center gap-4">
                            <div class="text-center">
                                <div class="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span class="text-primary font-bold">1</span>
                                </div>
                                <span class="text-muted-foreground text-sm">Crear Perfil</span>
                            </div>
                            <div class="hidden md:block text-muted-foreground">→</div>
                            <div class="text-center">
                                <div class="h-10 w-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span class="text-muted-foreground font-bold">2</span>
                                </div>
                                <span class="text-muted-foreground text-sm">Buscar Vacantes</span>
                            </div>
                            <div class="hidden md:block text-muted-foreground">→</div>
                            <div class="text-center">
                                <div class="h-10 w-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span class="text-muted-foreground font-bold">3</span>
                                </div>
                                <span class="text-muted-foreground text-sm">Postularte</span>
                            </div>
                            <div class="hidden md:block text-muted-foreground">→</div>
                            <div class="text-center">
                                <div class="h-10 w-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span class="text-muted-foreground font-bold">4</span>
                                </div>
                                <span class="text-muted-foreground text-sm">Seguimiento</span>
                            </div>
                        </div>
                    </div>
                    
                    <button onclick="document.getElementById('auth-modal').classList.remove('hidden')" class="px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-semibold text-lg transition-all transform hover:scale-105">
                        Comenzar - Iniciar Sesión Obligatoria
                    </button>
                </div>
                
                <!-- Auth Modal -->
                <div id="auth-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center hidden">
                    <div class="bg-card border border-border rounded-2xl p-8 w-full max-w-md mx-4">
                        <h2 class="text-2xl font-bold text-foreground mb-6">Iniciar Sesión Obligatorio</h2>
                        <form onsubmit="handleLogin(event)">
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-foreground mb-2">Email</label>
                                <input type="email" id="email" required class="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground">
                            </div>
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-foreground mb-2">Contraseña</label>
                                <input type="password" id="password" required class="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground">
                            </div>
                            <button type="submit" class="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Entrar</button>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    </div>
</body>
</html>'''

# Leer el archivo actual
with open('api/index.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar y reemplazar el endpoint index
import re
pattern = r'@app\.route\("/"\)\s*def index\(\):[\s\S]*?if __name__ == "__main__":'
replacement = f'@app.route("/")\ndef index():\n    return """{index_html}"""\n\n\nif __name__ == "__main__":'

new_content = re.sub(pattern, replacement, content)

# Guardar el archivo
with open('api/index.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Index endpoint actualizado exitosamente!")