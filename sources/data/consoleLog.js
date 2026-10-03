import * as THREE from 'three/webgpu'

const text = `
█████╗ ██╗  ██╗███╗   ███╗███████╗██████╗ 
██╔══██╗██║  ██║████╗ ████║██╔════╝██╔══██╗
███████║███████║██╔████╔██║█████╗  ██║  ██║
██╔══██║██╔══██║██║╚██╔╝██║██╔══╝  ██║  ██║
██║  ██║██║  ██║██║ ╚═╝ ██║███████╗██████╔╝
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚═════╝ 
                                           
██████╗  ██████╗ ██████╗ ████████╗███████╗ ██████╗ ██╗     ██╗ ██████╗ 
██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██║     ██║██╔═══██╗
██████╔╝██║   ██║██████╔╝   ██║   █████╗  ██║   ██║██║     ██║██║   ██║
██╔═══╝ ██║   ██║██╔══██╗   ██║   ██╔══╝  ██║   ██║██║     ██║██║   ██║
██║     ╚██████╔╝██║  ██║   ██║   ██║     ╚██████╔╝███████╗██║╚██████╔╝
╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ 

╔═ Intro ═══════════════╗
║ Thank you for visiting my portfolio, you sneaky developer!
║ If you are curious about the stack and how I built this project, here’s everything you need to know.
╚═══════════════════════╝

╔═ Socials ═══════════════╗
║ Mail      ⇒ madajo444@gmail.com
║ LinkedIn  ⇒ https://www.linkedin.com/in/ahmed-yousef-55751023a/
║ GitHub    ⇒ https://github.com/Ahmed128aboshady
║ WhatsApp  ⇒ https://wa.me/201553900394
║ Odoo Live ⇒ https://ahmed-abo-shady.odoo.com
║ Web CV    ⇒ https://ahmed128aboshady.github.io/Ahmed-Abo-Shady-CV/
╚═══════════════════════╝

╔═ Debug ═══════════════╗
║ You can access the debug mode by adding #debug at the end of the URL and reloading.
║ Press [V] to toggle the free camera.
╚═══════════════════════╝

╔═ Three.js ════════════╗
║ Three.js is the library used to render this 3D world (release: ${THREE.REVISION})
║ https://threejs.org/
║ Utilizing WebGPU & TSL (Three.js Shading Language) for cutting-edge graphics performance.
╚═══════════════════════╝

╔═ About Ahmed ═════════╗
║ Senior Odoo Developer & ERP Solutions Architect with 5+ years of experience.
║ Specializing in enterprise ERP customization, PostgreSQL optimization,
║ scalable microservices, and modern web applications.
╚═══════════════════════╝

╔═ Live Projects ═══════╗
║ Odoo Enterprise Live ⇒ https://ahmed-abo-shady.odoo.com
║ Web CV & Portfolio   ⇒ https://ahmed128aboshady.github.io/Ahmed-Abo-Shady-CV/
║ GitHub Repositories  ⇒ https://github.com/Ahmed128aboshady
╚═══════════════════════╝

╔═ Source code ═════════╗
║ The code for this portfolio is available on GitHub:
║ https://github.com/Ahmed128aboshady/Ahed-Abo-Shady-Cv-2026
╚═══════════════════════╝

╔═ Contact & Hire ══════╗
║ WhatsApp ⇒ https://wa.me/201553900394
║ Email    ⇒ madajo444@gmail.com
║ LinkedIn ⇒ https://www.linkedin.com/in/ahmed-yousef-55751023a/
╚═══════════════════════╝
`
let finalText = ''
let finalStyles = []
const stylesSet = {
    letter: 'color: #ffffff; font: 400 1em monospace;',
    pipe: 'color: #D66FFF; font: 400 1em monospace;',
}
let currentStyle = null
for(let i = 0; i < text.length; i++)
{
    const char = text[i]

    const style = char.match(/[╔║═╗╚╝╔╝]/) ? 'pipe' : 'letter'
    if(style !== currentStyle)
    {
        currentStyle = style
        finalText += '%c'

        finalStyles.push(stylesSet[currentStyle])
    }
    finalText += char
}

export default [finalText, ...finalStyles]