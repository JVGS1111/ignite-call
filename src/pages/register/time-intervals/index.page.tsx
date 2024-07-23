import {
  Button,
  Checkbox,
  Heading,
  MultiStep,
  Text,
  TextInput,
} from '@ignite-ui/react'
import { Container, Header } from '../styles'

import {
  FormError,
  IntervalBox,
  IntervalDay,
  IntervalInputs,
  IntervalItem,
  IntervalsContainer,
} from './styles'
import { ArrowRight } from 'phosphor-react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { getWeekDays } from '@/utils/get-week-days'
import { zodResolver } from '@hookform/resolvers/zod'
import { convertTimeStringInMinutes } from '@/utils/convert-time-string-to-minutes'
import { api } from '@/lib/axios'

const timeIntervalsFormSchema = z.object({
  intervals: z
    .array(
      z.object({
        weekDay: z.number().min(0).max(6),
        enabled: z.boolean(),
        startTime: z.string(),
        endTime: z.string(),
      }),
    )
    .length(7)
    .transform((intervals) => intervals.filter((interval) => interval.enabled))
    .refine((intervals) => intervals.length > 0, {
      message: 'Você precisa selecionar pelo menos um dia da semana',
    })
    .transform((intervals) => {
      return intervals.map((interval) => {
        return {
          weekDay: interval.weekDay,
          startTimeInMinutes: convertTimeStringInMinutes(interval.startTime),
          endTimeInMinutes: convertTimeStringInMinutes(interval.endTime),
        }
      })
    })
    .refine(
      (intervals) => {
        return intervals.every(
          (interval) =>
            interval.endTimeInMinutes - 60 >= interval.startTimeInMinutes,
        )
      },
      {
        message:
          'O horário de término deve ser pelomenos 1h de distancia do início',
      },
    ),
})

type TimeIntervalsFormInput = z.input<typeof timeIntervalsFormSchema>
type TimeIntervalsFormOutput = z.output<typeof timeIntervalsFormSchema>

export default function TimeIntervals() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    control,
    watch,
  } = useForm<TimeIntervalsFormInput>({
    resolver: zodResolver(timeIntervalsFormSchema),
    defaultValues: {
      intervals: [
        { weekDay: 0, enabled: false, startTime: '09:00', endTime: '17:00' },
        { weekDay: 1, enabled: true, startTime: '09:00', endTime: '17:00' },
        { weekDay: 2, enabled: true, startTime: '09:00', endTime: '17:00' },
        { weekDay: 3, enabled: true, startTime: '09:00', endTime: '17:00' },
        { weekDay: 4, enabled: true, startTime: '09:00', endTime: '17:00' },
        { weekDay: 5, enabled: true, startTime: '09:00', endTime: '17:00' },
        { weekDay: 6, enabled: false, startTime: '09:00', endTime: '17:00' },
      ],
    },
  })
  const { fields } = useFieldArray({
    name: 'intervals',
    control,
  })

  const intervals = watch('intervals')

  const weekdays = getWeekDays()

  async function handleSetTimeInterval(result: any) {
    const { intervals } = result as TimeIntervalsFormOutput
    console.log(intervals)

    await api.post('/users/time-intervals', {
      intervals,
    })
  }

  return (
    <Container>
      <Header>
        <Heading as={'strong'}>Quase lá!</Heading>
        <Text>
          Defina o intervalo de horários que você está disponivel em cada dia da
          semana.
        </Text>
        <MultiStep size={4} currentStep={3}></MultiStep>
      </Header>
      <IntervalBox as="form" onSubmit={handleSubmit(handleSetTimeInterval)}>
        <IntervalsContainer>
          {fields.map((field, index) => (
            <IntervalItem key={field.id}>
              <IntervalDay>
                <Controller
                  name={`intervals.${index}.enabled`}
                  control={control}
                  render={({ field: _field }) => {
                    return (
                      <Checkbox
                        onCheckedChange={(checked) =>
                          _field.onChange(checked === true)
                        }
                        checked={_field.value as boolean}
                      />
                    )
                  }}
                />
                <Text>{weekdays[field.weekDay]}</Text>
              </IntervalDay>
              <IntervalInputs>
                <TextInput
                  size={'sm'}
                  type="time"
                  step={60}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                  crossOrigin={undefined}
                  disabled={intervals[index].enabled === false}
                  {...register(`intervals.${index}.startTime`)}
                ></TextInput>
                <TextInput
                  size={'sm'}
                  type="time"
                  step={60}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                  crossOrigin={undefined}
                  disabled={intervals[index].enabled === false}
                  {...register(`intervals.${index}.endTime`)}
                ></TextInput>
              </IntervalInputs>
            </IntervalItem>
          ))}
        </IntervalsContainer>
        {errors.intervals && (
          <FormError size="sm">{errors.intervals.root?.message}</FormError>
        )}
        <Button type="submit" disabled={isSubmitting}>
          Próximo passo <ArrowRight />
        </Button>
      </IntervalBox>
    </Container>
  )
}
