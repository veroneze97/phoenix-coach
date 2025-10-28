'use client'

/**
 * TrainingDashboard.tsx
 * =============================================
 * Página principal do módulo de Treinos (Phoenix Coach)
 * - Mostra agenda semanal com status dos treinos
 * - Botão "Criar treino" (modal) -> cria ou repete treinos via RPCs
 * - Navega para o TrainingEditor selecionando uma data
 * =============================================
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfWeek, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, PlusCircle, Flame, CheckCircle2, XCircle } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function TrainingDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const [weekDates, setWeekDates] = useState<Date[]>([])
  const [workouts, setWorkouts] = useState<Record<string, any>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [repeatData, setRepeatData] = useState({
    copy_from: '',
    weekday: 2,
    start: '',
    end: '',
    mode: 'append',
  })

  // 🔹 gera a semana atual (seg-dom)
  useEffect(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
    setWeekDates(days)
  }, [])

  // 🔹 carrega treinos da semana
  useEffect(() => {
    if (!user) return
    const fetchWeek = async () => {
      const start = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const end = format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('workouts')
        .select('date,status')
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end)

      if (error) console.error(error)
      else {
        const map: Record<string, any> = {}
        data.forEach((w) => (map[w.date] = w))
        setWorkouts(map)
      }
    }
    fetchWeek()
  }, [user])

  // 🔹 cria treino de hoje
  const handleCreateToday = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase.rpc('get_or_create_workout', {
        p_user: user.id,
        p_date: format(new Date(), 'yyyy-MM-dd'),
      })
      if (error) throw error
      toast.success('Treino de hoje criado!')
      router.push(`/training/editor?date=${format(new Date(), 'yyyy-MM-dd')}`)
    } catch (err) {
      toast.error('Erro ao criar treino de hoje')
      console.error(err)
    }
  }

  // 🔹 repete treino por dia da semana
  const handleRepeat = async () => {
    if (!user) return
    const { copy_from, start, end, weekday, mode } = repeatData
    try {
      const { data, error } = await supabase.rpc('repeat_day', {
        p_user: user.id,
        p_copy_from_date: copy_from,
        p_start: start,
        p_end: end,
        p_weekday: weekday,
        p_mode: mode,
      })
      if (error) throw error
      toast.success(`Treinos repetidos (${data} dias atualizados)`)
      setIsModalOpen(false)
    } catch (err) {
      toast.error('Erro ao repetir treinos')
      console.error(err)
    }
  }

  // 🔹 marcar treino como done/missed
  const handleStatus = async (date: string, status: 'done' | 'missed') => {
    if (!user) return
    try {
      const { error } = await supabase.rpc('set_workout_status', {
        p_user: user.id,
        p_date: date,
        p_status: status,
      })
      if (error) throw error
      setWorkouts((prev) => ({
        ...prev,
        [date]: { ...prev[date], status },
      }))
      toast.success(`Treino de ${format(new Date(date), 'dd/MM')} marcado como ${status}`)
    } catch (err) {
      toast.error('Erro ao atualizar status')
      console.error(err)
    }
  }

  // 🔹 render
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-phoenix-amber" />
          Agenda semanal
        </h1>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-phoenix-amber to-phoenix-gold text-white"
        >
          <PlusCircle className="w-4 h-4 mr-1" />
          Criar treino
        </Button>
      </div>

      {/* Semana */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {weekDates.map((date, i) => {
          const iso = format(date, 'yyyy-MM-dd')
          const day = format(date, 'EEE', { locale: ptBR })
          const num = format(date, 'dd')
          const status = workouts[iso]?.status ?? 'planned'
          const isToday =
            format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

          const statusIcon =
            status === 'done'
              ? <CheckCircle2 className="w-5 h-5 text-green-500" />
              : status === 'missed'
              ? <XCircle className="w-5 h-5 text-red-500" />
              : <Flame className="w-5 h-5 text-phoenix-amber animate-pulse" />

          return (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className={`rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer border ${
                isToday ? 'border-phoenix-amber bg-phoenix-amber/10' : 'border-gray-200'
              }`}
              onClick={() => router.push(`/training/editor?date=${iso}`)}
            >
              <span className="font-medium capitalize">{day}</span>
              <span className="text-2xl font-bold">{num}</span>
              <div className="mt-2">{statusIcon}</div>

              <div className="flex gap-1 mt-2">
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleStatus(iso, 'done') }}>
                  ✅
                </Button>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleStatus(iso, 'missed') }}>
                  ❌
                </Button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Modal criar/replicar treino */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar ou repetir treinos</DialogTitle>
            <DialogDescription>
              Crie o treino de hoje ou replique um treino existente em dias da semana.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Button
              onClick={handleCreateToday}
              className="w-full bg-phoenix-amber text-white"
            >
              Criar treino de hoje
            </Button>

            <div className="border-t pt-2 space-y-3">
              <Label className="text-sm font-medium">Data modelo (copiar de)</Label>
              <Input
                type="date"
                value={repeatData.copy_from}
                onChange={(e) =>
                  setRepeatData({ ...repeatData, copy_from: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Início</Label>
                  <Input
                    type="date"
                    value={repeatData.start}
                    onChange={(e) =>
                      setRepeatData({ ...repeatData, start: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Fim</Label>
                  <Input
                    type="date"
                    value={repeatData.end}
                    onChange={(e) =>
                      setRepeatData({ ...repeatData, end: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Dia da semana</Label>
                  <Input
                    type="number"
                    min={0}
                    max={6}
                    value={repeatData.weekday}
                    onChange={(e) =>
                      setRepeatData({
                        ...repeatData,
                        weekday: parseInt(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    0=Dom ... 6=Sáb
                  </p>
                </div>
                <div>
                  <Label>Modo</Label>
                  <select
                    className="w-full border rounded-md px-2 py-1 text-sm"
                    value={repeatData.mode}
                    onChange={(e) =>
                      setRepeatData({ ...repeatData, mode: e.target.value })
                    }
                  >
                    <option value="append">Append</option>
                    <option value="replace">Replace</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={handleRepeat}
                className="w-full bg-gradient-to-r from-phoenix-amber to-phoenix-gold text-white"
              >
                Repetir treinos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
