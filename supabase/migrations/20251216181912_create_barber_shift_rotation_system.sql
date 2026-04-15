/*
  # Sistema de Turnos Rotativos para Barbeiros

  ## Resumo
  Este sistema permite que barbeiros trabalhem em turnos alternados (ex: uma semana de manhã, outra de tarde).
  Cada barbeiro pode ter múltiplos templates de turno e uma configuração de rotação.

  ## Tabelas Criadas

  ### `barber_shift_templates`
  Define os templates de turno que um barbeiro pode ter:
  - `id` (uuid, primary key) - Identificador único do template
  - `barber_id` (uuid, foreign key) - Referência ao barbeiro
  - `shift_name` (text) - Nome do turno (ex: "Manhã", "Tarde", "Noite")
  - `work_start_time` (time) - Hora de início do trabalho
  - `work_end_time` (time) - Hora de fim do trabalho
  - `lunch_start_time` (time) - Hora de início do almoço
  - `lunch_end_time` (time) - Hora de fim do almoço
  - `has_dinner_break` (boolean) - Indica se tem pausa para jantar
  - `dinner_start_time` (time) - Hora de início do jantar (nullable)
  - `dinner_end_time` (time) - Hora de fim do jantar (nullable)
  - `display_order` (integer) - Ordem de exibição dos turnos
  - `created_at` (timestamptz) - Data de criação

  ### `barber_shift_rotations`
  Configura como os turnos alternam para cada barbeiro:
  - `id` (uuid, primary key) - Identificador único da rotação
  - `barber_id` (uuid, foreign key, unique) - Referência ao barbeiro (um barbeiro só pode ter uma configuração)
  - `is_active` (boolean) - Se a rotação está ativa
  - `rotation_type` (text) - Tipo de rotação: 'weekly' (semanal) ou 'biweekly' (quinzenal)
  - `start_date` (date) - Data de início da rotação
  - `shift_sequence` (text[]) - Array com IDs dos shifts na ordem de rotação
  - `created_at` (timestamptz) - Data de criação
  - `updated_at` (timestamptz) - Data de última atualização

  ## Mudanças na Tabela `barbers`
  - `use_shift_rotation` (boolean) - Se true, usa turnos rotativos; se false, usa horário fixo

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Políticas para leitura pública (necessário para sistema de marcações)
  - Políticas para authenticated users modificarem dados

  ## Notas Importantes
  - Quando `use_shift_rotation` é false, o sistema usa os horários fixos tradicionais
  - Quando `use_shift_rotation` é true, os horários são determinados pelo turno ativo
  - O cálculo do turno ativo é feito baseado na data de início e tipo de rotação
  - shift_sequence contém os IDs dos templates de turno na ordem em que devem alternar
*/

-- Adicionar coluna use_shift_rotation à tabela barbers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'barbers' AND column_name = 'use_shift_rotation'
  ) THEN
    ALTER TABLE barbers ADD COLUMN use_shift_rotation boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Criar tabela de templates de turno
CREATE TABLE IF NOT EXISTS barber_shift_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  shift_name text NOT NULL,
  work_start_time time NOT NULL,
  work_end_time time NOT NULL,
  lunch_start_time time NOT NULL,
  lunch_end_time time NOT NULL,
  has_dinner_break boolean DEFAULT false NOT NULL,
  dinner_start_time time,
  dinner_end_time time,
  display_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para barber_shift_templates
CREATE INDEX IF NOT EXISTS idx_barber_shift_templates_barber_id 
  ON barber_shift_templates(barber_id);

CREATE INDEX IF NOT EXISTS idx_barber_shift_templates_barber_order 
  ON barber_shift_templates(barber_id, display_order);

-- Criar tabela de configuração de rotação
CREATE TABLE IF NOT EXISTS barber_shift_rotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE UNIQUE,
  is_active boolean DEFAULT true NOT NULL,
  rotation_type text NOT NULL CHECK (rotation_type IN ('weekly', 'biweekly')),
  start_date date NOT NULL,
  shift_sequence text[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índice para barber_shift_rotations
CREATE INDEX IF NOT EXISTS idx_barber_shift_rotations_barber_id 
  ON barber_shift_rotations(barber_id);

-- Enable RLS on barber_shift_templates
ALTER TABLE barber_shift_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para barber_shift_templates
CREATE POLICY "Public can view shift templates"
  ON barber_shift_templates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create shift templates"
  ON barber_shift_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update shift templates"
  ON barber_shift_templates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete shift templates"
  ON barber_shift_templates FOR DELETE
  TO authenticated
  USING (true);

-- Enable RLS on barber_shift_rotations
ALTER TABLE barber_shift_rotations ENABLE ROW LEVEL SECURITY;

-- Políticas para barber_shift_rotations
CREATE POLICY "Public can view shift rotations"
  ON barber_shift_rotations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create shift rotations"
  ON barber_shift_rotations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update shift rotations"
  ON barber_shift_rotations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete shift rotations"
  ON barber_shift_rotations FOR DELETE
  TO authenticated
  USING (true);