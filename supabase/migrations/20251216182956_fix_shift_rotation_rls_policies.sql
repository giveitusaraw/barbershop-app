/*
  # Corrigir Políticas RLS para Turnos Rotativos

  ## Resumo
  As políticas RLS das tabelas de turnos rotativos estavam a exigir autenticação,
  mas o sistema usa a chave anon. Esta migração altera as políticas para permitir
  acesso público (anon), seguindo o mesmo padrão da tabela barbers.

  ## Alterações
  - Remove políticas antigas que exigem autenticação
  - Cria novas políticas que permitem acesso público
  - Mantém consistência com as políticas da tabela barbers

  ## Segurança
  - As políticas permitem acesso público para operações CRUD
  - Isto é consistente com o modelo de segurança existente da aplicação
*/

-- Remover políticas antigas de barber_shift_templates
DROP POLICY IF EXISTS "Authenticated users can create shift templates" ON barber_shift_templates;
DROP POLICY IF EXISTS "Authenticated users can update shift templates" ON barber_shift_templates;
DROP POLICY IF EXISTS "Authenticated users can delete shift templates" ON barber_shift_templates;

-- Criar novas políticas públicas para barber_shift_templates
CREATE POLICY "Anyone can insert shift templates"
  ON barber_shift_templates FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update shift templates"
  ON barber_shift_templates FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete shift templates"
  ON barber_shift_templates FOR DELETE
  TO public
  USING (true);

-- Remover políticas antigas de barber_shift_rotations
DROP POLICY IF EXISTS "Authenticated users can create shift rotations" ON barber_shift_rotations;
DROP POLICY IF EXISTS "Authenticated users can update shift rotations" ON barber_shift_rotations;
DROP POLICY IF EXISTS "Authenticated users can delete shift rotations" ON barber_shift_rotations;

-- Criar novas políticas públicas para barber_shift_rotations
CREATE POLICY "Anyone can insert shift rotations"
  ON barber_shift_rotations FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update shift rotations"
  ON barber_shift_rotations FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete shift rotations"
  ON barber_shift_rotations FOR DELETE
  TO public
  USING (true);