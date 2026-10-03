import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

export class NavalBattle
{
    constructor()
    {
        this.game = Game.getInstance()

        this.bounty = 0
        this.shipsSunk = 0
        this.lastPlayerFire = 0
        this.cooldown = 650 // ms

        this.enemies = []
        this.cannonballs = []
        this.chests = []
        this.effects = []

        this.setSounds()
        this.setMeshes()
        this.setEnemies()
        this.setInputs()
        this.setUI()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 15)
    }

    setSounds()
    {
        this.sounds = {}
        this.sounds.cannon = this.game.audio.register({
            path: 'sounds/pirate/cannon_1.wav',
            autoplay: false,
            loop: false,
            volume: 0.9,
            antiSpam: 0.2
        })
        this.sounds.cannonEnemy = this.game.audio.register({
            path: 'sounds/pirate/cannon_2.wav',
            autoplay: false,
            loop: false,
            volume: 0.6,
            antiSpam: 0.3
        })
        this.sounds.hit = this.game.audio.register({
            path: 'sounds/pirate/hit_wood_0.wav',
            autoplay: false,
            loop: false,
            volume: 0.85,
            antiSpam: 0.1
        })
        this.sounds.splash = this.game.audio.register({
            path: 'sounds/pirate/splash_0.wav',
            autoplay: false,
            loop: false,
            volume: 0.7,
            antiSpam: 0.2
        })
        this.sounds.coins = this.game.audio.register({
            path: 'sounds/pirate/coins.wav',
            autoplay: false,
            loop: false,
            volume: 0.95,
            antiSpam: 0.3
        })
    }

    setMeshes()
    {
        // Reusable cannonball geometry and material
        this.cannonballGeometry = new THREE.SphereGeometry(0.22, 8, 8)
        this.playerBallMaterial = new THREE.MeshStandardMaterial({
            color: 0x1f1f1f,
            roughness: 0.3,
            metalness: 0.85
        })
        this.enemyBallMaterial = new THREE.MeshStandardMaterial({
            color: 0xd63031,
            roughness: 0.4,
            metalness: 0.4,
            emissive: 0x900000
        })

        // Reusable smoke puff geometry
        this.smokeGeometry = new THREE.SphereGeometry(0.35, 6, 6)
        this.smokeMaterial = new THREE.MeshBasicMaterial({
            color: 0xdddddd,
            transparent: true,
            opacity: 0.7
        })

        // Flash material
        this.flashGeometry = new THREE.SphereGeometry(0.45, 6, 6)
        this.flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa22,
            transparent: true,
            opacity: 0.95
        })
    }

    setEnemies()
    {
        const enemyDefs = [
            {
                name: "Blackbeard's Galleon",
                model: this.game.resources.pirateGalleonModel,
                position: new THREE.Vector3(14, 0.05, -12),
                rotation: 0.5,
                maxHp: 100,
                radius: 3.2,
                bounty: 500
            },
            {
                name: "Crimson Corsair Frigate",
                model: this.game.resources.pirateFrigateModel,
                position: new THREE.Vector3(-14, 0.05, 10),
                rotation: -1.0,
                maxHp: 75,
                radius: 2.8,
                bounty: 350
            },
            {
                name: "Ghost Raider Brigantine",
                model: this.game.resources.pirateBrigantineModel,
                position: new THREE.Vector3(28, 0.05, 26),
                rotation: 2.1,
                maxHp: 60,
                radius: 2.5,
                bounty: 250
            },
            {
                name: "Imperial Hunter Frigate",
                model: this.game.resources.pirateFrigateModel,
                position: new THREE.Vector3(-28, 0.05, -24),
                rotation: 0.35,
                maxHp: 75,
                radius: 2.8,
                bounty: 350
            },
            {
                name: "Kraken's Dread Galleon",
                model: this.game.resources.pirateGalleonModel,
                position: new THREE.Vector3(45, 0.05, 0),
                rotation: -2.3,
                maxHp: 120,
                radius: 3.4,
                bounty: 600
            }
        ]

        // Add decoration sea rocks
        if(this.game.resources.seaRockModel)
        {
            const rockPositions = [
                new THREE.Vector3(45, 0, -10),
                new THREE.Vector3(-25, 0, 48),
                new THREE.Vector3(-48, 0, -15),
                new THREE.Vector3(12, 0, 65)
            ]
            for(const rPos of rockPositions)
            {
                const rock = this.game.resources.seaRockModel.scene.clone()
                rock.position.copy(rPos)
                rock.rotation.y = Math.random() * Math.PI * 2
                rock.scale.setScalar(1.2 + Math.random() * 0.8)
                this.game.scene.add(rock)
            }
        }

        // Add harbor defense cannons
        if(this.game.resources.cannonModel)
        {
            const cannon1 = this.game.resources.cannonModel.scene.clone()
            cannon1.position.set(2.2, 0.05, -2.8)
            cannon1.rotation.y = 0.6
            cannon1.scale.setScalar(0.4)
            this.game.materials.updateObject(cannon1)
            this.game.scene.add(cannon1)

            const cannon2 = this.game.resources.cannonModel.scene.clone()
            cannon2.position.set(-3.8, 0.05, -2.8)
            cannon2.rotation.y = -0.4
            cannon2.scale.setScalar(0.4)
            this.game.materials.updateObject(cannon2)
            this.game.scene.add(cannon2)
        }

        for(const def of enemyDefs)
        {
            if(!def.model) continue

            const shipGroup = new THREE.Group()
            shipGroup.position.copy(def.position)
            shipGroup.rotation.y = def.rotation

            const model = def.model.scene.clone()
            this.game.materials.updateObject(model)
            shipGroup.add(model)

            // Health bar in 3D
            const hpGroup = new THREE.Group()
            hpGroup.position.set(0, 3.2, 0)

            const bgGeo = new THREE.BoxGeometry(2.4, 0.22, 0.1)
            const bgMat = new THREE.MeshBasicMaterial({ color: 0x1a0505 })
            const hpBg = new THREE.Mesh(bgGeo, bgMat)
            hpGroup.add(hpBg)

            const fillGeo = new THREE.BoxGeometry(2.3, 0.18, 0.12)
            const fillMat = new THREE.MeshBasicMaterial({ color: 0x27ae60 })
            const hpFill = new THREE.Mesh(fillGeo, fillMat)
            hpGroup.add(hpFill)

            shipGroup.add(hpGroup)
            this.game.scene.add(shipGroup)

            const enemy = {
                name: def.name,
                group: shipGroup,
                model: model,
                hpGroup: hpGroup,
                hpFill: hpFill,
                hp: def.maxHp,
                maxHp: def.maxHp,
                radius: def.radius,
                bounty: def.bounty,
                basePos: def.position.clone(),
                lastFire: Date.now() + Math.random() * 3000,
                isSunk: false,
                sinkProgress: 0,
                bobOffset: Math.random() * Math.PI * 2
            }

            this.enemies.push(enemy)
        }
    }

    setInputs()
    {
        // Spacebar and F key fire
        window.addEventListener('keydown', (e) =>
        {
            if(e.code === 'Space' || e.code === 'KeyF')
            {
                this.firePlayerCannons()
            }
        })

        // Also fire on canvas click if clicking outside UI
        this.game.canvasElement.addEventListener('pointerdown', (e) =>
        {
            // Only fire if left button
            if(e.button === 0)
            {
                this.firePlayerCannons()
            }
        })
    }

    firePlayerCannons()
    {
        const now = Date.now()
        if(now - this.lastPlayerFire < this.cooldown) return
        this.lastPlayerFire = now

        const playerVehicle = this.game.physicalVehicle
        if(!playerVehicle || !playerVehicle.position) return

        const playerPos = playerVehicle.position.clone()
        const playerRot = playerVehicle.quaternion.clone()

        // Direction vectors
        const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(playerRot).normalize()
        const right = new THREE.Vector3(0, 0, 1).applyQuaternion(playerRot).normalize()
        const left = new THREE.Vector3(0, 0, -1).applyQuaternion(playerRot).normalize()
        const up = new THREE.Vector3(0, 1, 0)

        // Find nearest enemy to bias broadside fire
        let nearestEnemy = null
        let nearestDist = Infinity
        for(const e of this.enemies)
        {
            if(e.isSunk) continue
            const dist = e.group.position.distanceTo(playerPos)
            if(dist < nearestDist)
            {
                nearestDist = dist
                nearestEnemy = e
            }
        }

        // Fire both Port and Starboard broadside salvos
        const cannonShots = [
            { pos: playerPos.clone().add(left.clone().multiplyScalar(0.75)).add(new THREE.Vector3(0, 0.7, 0)), dir: left.clone().add(up.clone().multiplyScalar(0.12)).normalize() },
            { pos: playerPos.clone().add(right.clone().multiplyScalar(0.75)).add(new THREE.Vector3(0, 0.7, 0)), dir: right.clone().add(up.clone().multiplyScalar(0.12)).normalize() }
        ]

        // If target is in front within 45m, add a bow chaser cannon shot
        if(nearestEnemy && nearestDist < 45)
        {
            const dirToEnemy = nearestEnemy.group.position.clone().sub(playerPos).normalize()
            cannonShots.push({
                pos: playerPos.clone().add(forward.clone().multiplyScalar(1.2)).add(new THREE.Vector3(0, 0.7, 0)),
                dir: dirToEnemy.add(new THREE.Vector3(0, 0.15, 0)).normalize()
            })
        }

        // Play cannon sound
        this.sounds.cannon.play()

        // Screen shake
        if(this.game.explosions)
        {
            this.game.explosions.explode(playerPos, 4, 1.2)
        }

        for(const shot of cannonShots)
        {
            // Spawn muzzle flash
            this.spawnFlash(shot.pos)
            this.spawnSmoke(shot.pos)

            // Spawn cannonball
            const ballMesh = new THREE.Mesh(this.cannonballGeometry, this.playerBallMaterial)
            ballMesh.position.copy(shot.pos)
            this.game.scene.add(ballMesh)

            const speed = 36 + Math.random() * 4
            const velocity = shot.dir.clone().multiplyScalar(speed)

            this.cannonballs.push({
                mesh: ballMesh,
                velocity: velocity,
                owner: 'player',
                created: now,
                ttl: 2600
            })
        }

        // Trigger fire button animation
        if(this.fireButton)
        {
            this.fireButton.style.transform = 'scale(0.88)'
            setTimeout(() => { this.fireButton.style.transform = 'scale(1)' }, 120)
        }
    }

    spawnFlash(position)
    {
        const flash = new THREE.Mesh(this.flashGeometry, this.flashMaterial.clone())
        flash.position.copy(position)
        this.game.scene.add(flash)
        this.effects.push({
            mesh: flash,
            created: Date.now(),
            ttl: 90,
            update: (progress) => {
                const s = 1 + progress * 2.5
                flash.scale.set(s, s, s)
                flash.material.opacity = 1 - progress
            }
        })
    }

    spawnSmoke(position)
    {
        const smoke = new THREE.Mesh(this.smokeGeometry, this.smokeMaterial.clone())
        smoke.position.copy(position)
        this.game.scene.add(smoke)
        this.effects.push({
            mesh: smoke,
            created: Date.now(),
            ttl: 600,
            update: (progress) => {
                const s = 1 + progress * 3.5
                smoke.scale.set(s, s, s)
                smoke.position.y += 0.015
                smoke.material.opacity = (1 - progress) * 0.7
            }
        })
    }

    fireEnemyCannon(enemy)
    {
        const playerPos = this.game.physicalVehicle?.position
        if(!playerPos) return

        this.sounds.cannonEnemy.play()

        const enemyPos = enemy.group.position.clone().add(new THREE.Vector3(0, 1.2, 0))
        const dir = playerPos.clone().sub(enemyPos).normalize()
        dir.y += 0.18 // ballistic arc
        dir.normalize()

        this.spawnFlash(enemyPos)
        this.spawnSmoke(enemyPos)

        const ballMesh = new THREE.Mesh(this.cannonballGeometry, this.enemyBallMaterial)
        ballMesh.position.copy(enemyPos)
        this.game.scene.add(ballMesh)

        this.cannonballs.push({
            mesh: ballMesh,
            velocity: dir.multiplyScalar(28),
            owner: 'enemy',
            created: Date.now(),
            ttl: 2800
        })
    }

    damageEnemy(enemy, amount, hitPos)
    {
        enemy.hp -= amount
        this.sounds.hit.play()

        // Visual impact explosion
        if(this.game.world.fireballs)
        {
            this.game.world.fireballs.create(hitPos, 2.2, 2.5)
        }

        // Damage effect
        this.spawnFlash(hitPos)
        this.spawnSmoke(hitPos)

        // Update HP Bar
        const hpPercent = Math.max(0, enemy.hp / enemy.maxHp)
        enemy.hpFill.scale.x = hpPercent
        enemy.hpFill.position.x = - (1 - hpPercent) * 1.15

        if(hpPercent < 0.3)
            enemy.hpFill.material.color.setHex(0xe74c3c) // Red
        else if(hpPercent < 0.6)
            enemy.hpFill.material.color.setHex(0xf39c12) // Orange

        if(enemy.hp <= 0 && !enemy.isSunk)
        {
            this.sinkEnemy(enemy)
        }
    }

    sinkEnemy(enemy)
    {
        enemy.isSunk = true
        this.shipsSunk++
        this.bounty += enemy.bounty

        // Triple deck explosion
        const pos = enemy.group.position
        if(this.game.world.fireballs)
        {
            this.game.world.fireballs.create(pos.clone().add(new THREE.Vector3(0, 1, 0)), 4, 4)
            setTimeout(() => {
                this.game.world.fireballs?.create(pos.clone().add(new THREE.Vector3(1, 1.5, 0.5)), 3, 3)
            }, 300)
            setTimeout(() => {
                this.game.world.fireballs?.create(pos.clone().add(new THREE.Vector3(-1, 0.8, -0.5)), 3.5, 3.5)
            }, 600)
        }

        // Spawn floating Gold Loot Chest
        this.spawnLootChest(pos.clone())

        // Show floating message
        this.notify(`⚔️ Sunk ${enemy.name}! +$${enemy.bounty} Gold Bounty!`)
        this.updateHUD()
    }

    spawnLootChest(position)
    {
        if(!this.game.resources.lootChestModel) return

        const chest = this.game.resources.lootChestModel.scene.clone()
        chest.position.set(position.x, 0.12, position.z)
        this.game.materials.updateObject(chest)
        this.game.scene.add(chest)

        this.chests.push({
            mesh: chest,
            basePos: position.clone(),
            created: Date.now(),
            collected: false
        })
    }

    notify(text)
    {
        const banner = document.getElementById('pirate-banner')
        if(banner)
        {
            banner.innerHTML = `<span style="color:#ffd700;font-weight:bold;">${text}</span>`
            banner.style.opacity = '1'
            banner.style.transform = 'translateY(0px)'
            clearTimeout(this.bannerTimer)
            this.bannerTimer = setTimeout(() => {
                banner.style.opacity = '0.9'
                this.updateHUD()
            }, 4000)
        }
    }

    setUI()
    {
        // Container
        const hud = document.createElement('div')
        hud.id = 'pirate-hud'
        hud.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: none;
            font-family: 'Pally', sans-serif, system-ui;
        `

        // Banner
        const banner = document.createElement('div')
        banner.id = 'pirate-banner'
        banner.style.cssText = `
            background: linear-gradient(135deg, rgba(16, 28, 48, 0.92), rgba(28, 16, 38, 0.92));
            color: #ffffff;
            border: 2px solid rgba(255, 215, 0, 0.6);
            border-radius: 30px;
            padding: 8px 24px;
            font-size: 15px;
            font-weight: 600;
            letter-spacing: 0.5px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(255, 215, 0, 0.25);
            backdrop-filter: blur(8px);
            transition: all 0.3s ease;
            text-align: center;
        `
        banner.innerHTML = `🏴‍☠️ <strong>Ahmed's Naval Fleet Battle</strong> | Sunk: 0/${this.enemies.length} | Bounty: $0`
        hud.appendChild(banner)
        document.body.appendChild(hud)

        // Action Fire Button
        const fireBtn = document.createElement('button')
        fireBtn.id = 'pirate-fire-button'
        fireBtn.innerHTML = `
            <div style="font-size:24px;line-height:1;">💥</div>
            <div style="font-size:12px;font-weight:800;letter-spacing:1px;margin-top:2px;">FIRE</div>
            <div style="font-size:9px;opacity:0.75;margin-top:1px;">[SPACE]</div>
        `
        fireBtn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 84px;
            height: 84px;
            border-radius: 50%;
            background: radial-gradient(circle, #e74c3c 30%, #c0392b 90%);
            border: 3px solid #f39c12;
            color: #ffffff;
            font-family: 'Pally', sans-serif, system-ui;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 8px 25px rgba(231, 76, 60, 0.6), 0 0 20px rgba(243, 156, 18, 0.4);
            z-index: 1001;
            transition: transform 0.1s ease, box-shadow 0.2s ease;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        `
        fireBtn.addEventListener('pointerdown', (e) =>
        {
            e.stopPropagation()
            this.firePlayerCannons()
        })
        document.body.appendChild(fireBtn)
        this.fireButton = fireBtn
    }

    updateHUD()
    {
        const banner = document.getElementById('pirate-banner')
        if(banner)
        {
            banner.innerHTML = `🏴‍☠️ <strong>Ahmed's Naval Fleet Battle</strong> | Sunk: ${this.shipsSunk}/${this.enemies.length} | Bounty: <span style="color:#ffd700;">$${this.bounty}</span>`
        }
    }

    update()
    {
        const delta = this.game.ticker.deltaScaled
        const elapsed = this.game.ticker.elapsed
        const now = Date.now()
        const playerPos = this.game.physicalVehicle?.position

        // 1. Update Enemies (Floating bobbing, facing HP bar, retaliation AI, sinking)
        for(let i = this.enemies.length - 1; i >= 0; i--)
        {
            const enemy = this.enemies[i]

            // Always make health bar billboard towards camera
            if(this.game.view?.camera)
            {
                enemy.hpGroup.quaternion.copy(this.game.view.camera.quaternion)
            }

            if(enemy.isSunk)
            {
                // Sinking animation: tilt and go down
                enemy.sinkProgress += delta * 0.4
                enemy.group.position.y -= delta * 0.35
                enemy.group.rotation.x += delta * 0.15
                enemy.group.rotation.z += delta * 0.08

                if(enemy.sinkProgress >= 3.5)
                {
                    this.game.scene.remove(enemy.group)
                    this.enemies.splice(i, 1)
                }
                continue
            }

            // Nautical floating wave bobbing
            const waveY = Math.sin(elapsed * 2.2 + enemy.bobOffset) * 0.06
            const waveRoll = Math.sin(elapsed * 1.5 + enemy.bobOffset) * 0.035
            enemy.group.position.y = enemy.basePos.y + waveY
            enemy.group.rotation.z = waveRoll

            // Retaliation fire
            if(playerPos && now - enemy.lastFire > 4500)
            {
                const dist = enemy.group.position.distanceTo(playerPos)
                if(dist < 38)
                {
                    enemy.lastFire = now + Math.random() * 1500
                    this.fireEnemyCannon(enemy)
                }
            }
        }

        // 2. Update Cannonballs
        const gravity = -11.5 * delta
        for(let i = this.cannonballs.length - 1; i >= 0; i--)
        {
            const ball = this.cannonballs[i]
            const age = now - ball.created

            if(age > ball.ttl || ball.mesh.position.y < -0.1)
            {
                // Water splash
                if(ball.mesh.position.y <= 0.1)
                {
                    this.sounds.splash.play()
                    this.spawnSmoke(ball.mesh.position)
                }
                this.game.scene.remove(ball.mesh)
                this.cannonballs.splice(i, 1)
                continue
            }

            // Apply ballistic motion
            ball.velocity.y += gravity
            ball.mesh.position.x += ball.velocity.x * delta
            ball.mesh.position.y += ball.velocity.y * delta
            ball.mesh.position.z += ball.velocity.z * delta

            // Collision check
            if(ball.owner === 'player')
            {
                for(const enemy of this.enemies)
                {
                    if(enemy.isSunk) continue
                    const d = ball.mesh.position.distanceTo(enemy.group.position)
                    if(d < enemy.radius)
                    {
                        // Direct hit!
                        this.damageEnemy(enemy, 25, ball.mesh.position.clone())
                        this.game.scene.remove(ball.mesh)
                        this.cannonballs.splice(i, 1)
                        break
                    }
                }
            }
            else if(ball.owner === 'enemy' && playerPos)
            {
                // Check hit on player
                const d = ball.mesh.position.distanceTo(playerPos)
                if(d < 1.8)
                {
                    this.sounds.hit.play()
                    if(this.game.world.fireballs)
                    {
                        this.game.world.fireballs.create(ball.mesh.position, 2, 2)
                    }
                    this.game.scene.remove(ball.mesh)
                    this.cannonballs.splice(i, 1)
                }
            }
        }

        // 3. Update Floating Loot Chests
        if(playerPos)
        {
            for(let i = this.chests.length - 1; i >= 0; i--)
            {
                const chest = this.chests[i]
                if(chest.collected) continue

                // Gentle wave bobbing & rotation
                chest.mesh.rotation.y += delta * 0.8
                chest.mesh.position.y = 0.12 + Math.sin(elapsed * 3 + chest.created) * 0.05

                const dist = chest.mesh.position.distanceTo(playerPos)
                if(dist < 2.8)
                {
                    // Collected!
                    chest.collected = true
                    this.sounds.coins.play()
                    this.bounty += 250
                    this.notify(`💰 Sunk Fleet Loot Collected! +$250 Gold!`)
                    this.updateHUD()

                    // Gold spark explosion
                    this.spawnFlash(chest.mesh.position)
                    this.game.scene.remove(chest.mesh)
                    this.chests.splice(i, 1)
                }
            }
        }

        // 4. Update Visual Effects (Smoke, Muzzle flashes)
        for(let i = this.effects.length - 1; i >= 0; i--)
        {
            const effect = this.effects[i]
            const age = now - effect.created
            const progress = age / effect.ttl

            if(progress >= 1)
            {
                this.game.scene.remove(effect.mesh)
                this.effects.splice(i, 1)
            }
            else
            {
                effect.update(progress)
            }
        }
    }
}
