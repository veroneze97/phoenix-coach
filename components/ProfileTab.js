'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  User,
  Calendar,
  Ruler,
  Weight,
  Target,
  Utensils,
  Footprints,
  Moon,
  Link2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Settings,
  LogOut,
  Edit,
  Save,
} from 'lucide-react'

// Static data for scaffold
const STATIC_USER = {
  name: 'Atleta Phoenix',
  email: 'atleta@phoenix.com',
  age: 28,
  height: 175, // cm
  weight: 75, // kg
  goals: ['muscle_gain', 'endurance'],
}

const STATIC_TARGETS = {
  calories: 2500,
  steps: 10000,
  sleep: 8, // hours
}

const INTEGRATIONS = [
  {
    id: 'strava',
    name: 'Strava',
    description: 'Sincronize suas corridas e treinos',
    icon: '🏃',
    connected: false,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
  },
  {
    id: 'google_fit',
    name: 'Google Fit',
    description: 'Importe dados de saúde e atividades',
    icon: '💚',
    connected: false,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  {
    id: 'ios_shortcut',
    name: 'iOS Shortcuts',
    description: 'Automatize com Apple Health',
    icon: '📱',
    connected: true,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
]

const GOAL_OPTIONS = [
  { id: 'weight_loss', label: 'Perda de Peso', icon: '⚖️' },
  { id: 'muscle_gain', label: 'Ganho de Massa', icon: '💪' },
  { id: 'endurance', label: 'Resistência', icon: '🏃' },
  { id: 'flexibility', label: 'Flexibilidade', icon: '🧘' },
  { id: 'health', label: 'Saúde Geral', icon: '❤️' },
]

export default function ProfileTab() {
  const user = STATIC_USER
  const targets = STATIC_TARGETS

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-card relative overflow-hidden border-phoenix-amber/30">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-phoenix-amber/5 via-transparent to-phoenix-gold/5" />

          <CardContent className="relative z-10 pt-6">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-phoenix-amber to-phoenix-gold shadow-lg">
                  <span className="text-4xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <motion.div
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-phoenix-amber to-phoenix-gold shadow-md"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Edit className="h-4 w-4 text-white" />
                </motion.div>
              </motion.div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="mb-1 text-2xl font-bold">{user.name}</h2>
                <p className="mb-3 text-sm text-muted-foreground">{user.email}</p>

                {/* Quick Stats */}
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-phoenix-amber" />
                    <span className="text-muted-foreground">{user.age} anos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Ruler className="h-4 w-4 text-phoenix-amber" />
                    <span className="text-muted-foreground">{user.height} cm</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Weight className="h-4 w-4 text-phoenix-amber" />
                    <span className="text-muted-foreground">{user.weight} kg</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-phoenix-amber/30 hover:bg-phoenix-amber/10"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Editar Perfil
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-phoenix-amber" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Mantenha seus dados atualizados para recomendações precisas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={user.name}
                  placeholder="Seu nome"
                  className="bg-secondary/50"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="number"
                  value={user.age}
                  placeholder="28"
                  className="bg-secondary/50"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={user.height}
                  placeholder="175"
                  className="bg-secondary/50"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={user.weight}
                  placeholder="75"
                  className="bg-secondary/50"
                  readOnly
                />
              </div>
            </div>

            {/* Goals */}
            <div className="mt-6">
              <Label className="mb-3 block">Objetivos</Label>
              <div className="flex flex-wrap gap-2">
                {GOAL_OPTIONS.map((goal) => {
                  const isSelected = user.goals.includes(goal.id)
                  return (
                    <motion.div
                      key={goal.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Badge
                        variant={isSelected ? 'default' : 'outline'}
                        className={`cursor-pointer px-3 py-2 transition-colors ${
                          isSelected
                            ? 'bg-gradient-to-r from-phoenix-amber to-phoenix-gold hover:opacity-90'
                            : 'hover:bg-secondary'
                        }`}
                      >
                        <span className="mr-2">{goal.icon}</span>
                        {goal.label}
                      </Badge>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Targets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-phoenix-amber" />
              Metas Diárias
            </CardTitle>
            <CardDescription>Configure suas metas personalizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Calories Target */}
              <div className="space-y-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded-lg bg-orange-500/10 p-2">
                    <Utensils className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Calorias</Label>
                    <p className="text-xs text-muted-foreground">Diárias</p>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    value={targets.calories}
                    className="h-16 bg-secondary/50 text-center text-2xl font-bold"
                    readOnly
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    kcal
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>1500</span>
                  <span>2500</span>
                  <span>3500</span>
                </div>
              </div>

              {/* Steps Target */}
              <div className="space-y-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded-lg bg-blue-500/10 p-2">
                    <Footprints className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Passos</Label>
                    <p className="text-xs text-muted-foreground">Diários</p>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    value={targets.steps}
                    className="h-16 bg-secondary/50 text-center text-2xl font-bold"
                    readOnly
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    passos
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>5k</span>
                  <span>10k</span>
                  <span>15k</span>
                </div>
              </div>

              {/* Sleep Target */}
              <div className="space-y-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded-lg bg-purple-500/10 p-2">
                    <Moon className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Sono</Label>
                    <p className="text-xs text-muted-foreground">Horas</p>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    value={targets.sleep}
                    className="h-16 bg-secondary/50 text-center text-2xl font-bold"
                    readOnly
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    horas
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>6h</span>
                  <span>8h</span>
                  <span>10h</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button
                className="w-full bg-gradient-to-r from-phoenix-amber to-phoenix-gold transition-opacity hover:opacity-90"
                disabled
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar Metas
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Integrations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-phoenix-amber" />
              Integrações
            </CardTitle>
            <CardDescription>Conecte seus apps favoritos de saúde e fitness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {INTEGRATIONS.map((integration, index) => (
                <motion.div
                  key={integration.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Card
                    className={`glass-card ${integration.borderColor} cursor-pointer border-2 transition-all hover:shadow-lg`}
                  >
                    <CardContent className="pt-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div className={`rounded-lg p-3 ${integration.bgColor}`}>
                          <span className="text-3xl">{integration.icon}</span>
                        </div>
                        {integration.connected ? (
                          <Badge className="border-green-500/30 bg-green-500/20 text-green-500">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Conectado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-dashed">
                            <Circle className="mr-1 h-3 w-3" />
                            Desconectado
                          </Badge>
                        )}
                      </div>

                      <h3 className={`mb-1 text-lg font-bold ${integration.color}`}>
                        {integration.name}
                      </h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        {integration.description}
                      </p>

                      <Button
                        variant={integration.connected ? 'outline' : 'default'}
                        className={
                          integration.connected
                            ? 'w-full'
                            : 'w-full bg-gradient-to-r from-phoenix-amber to-phoenix-gold hover:opacity-90'
                        }
                        size="sm"
                      >
                        {integration.connected ? (
                          <>
                            <Settings className="mr-2 h-4 w-4" />
                            Gerenciar
                          </>
                        ) : (
                          <>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Conectar
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Additional Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-phoenix-amber" />
              Configurações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                Preferências de Notificação
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Privacidade e Dados
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Unidades de Medida
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Idioma
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:bg-red-500/10 hover:text-red-500"
              >
                Excluir Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* App Info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        <Card className="glass-card border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="mb-2 text-sm text-muted-foreground">Phoenix Coach v1.0.0</p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <a href="#" className="transition-colors hover:text-phoenix-amber">
                Termos de Uso
              </a>
              <span>•</span>
              <a href="#" className="transition-colors hover:text-phoenix-amber">
                Política de Privacidade
              </a>
              <span>•</span>
              <a href="#" className="transition-colors hover:text-phoenix-amber">
                Suporte
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
