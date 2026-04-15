import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Palette } from 'lucide-react';

interface HeroBackgroundEditorProps {
  useBackgroundImage?: boolean;
  backgroundImageUrl?: string;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
  gradientDirection?: string;
  onUseBackgroundImageChange: (value: boolean) => void;
  onBackgroundImageChange: (file: File | null) => void;
  onGradientFromChange: (value: string) => void;
  onGradientViaChange: (value: string) => void;
  onGradientToChange: (value: string) => void;
  onGradientDirectionChange: (value: string) => void;
  onRemoveOldImage?: () => void;
}

const gradientDirections = [
  { value: 'to-r', label: 'Para a direita →' },
  { value: 'to-l', label: 'Para a esquerda ←' },
  { value: 'to-t', label: 'Para cima ↑' },
  { value: 'to-b', label: 'Para baixo ↓' },
  { value: 'to-tr', label: 'Diagonal ↗' },
  { value: 'to-tl', label: 'Diagonal ↖' },
  { value: 'to-br', label: 'Diagonal ↘' },
  { value: 'to-bl', label: 'Diagonal ↙' },
];

const HeroBackgroundEditor: React.FC<HeroBackgroundEditorProps> = ({
  useBackgroundImage = false,
  backgroundImageUrl,
  gradientFrom = '#111827',
  gradientVia = '#1f2937',
  gradientTo = '#92400e',
  gradientDirection = 'to-br',
  onUseBackgroundImageChange,
  onBackgroundImageChange,
  onGradientFromChange,
  onGradientViaChange,
  onGradientToChange,
  onGradientDirectionChange,
  onRemoveOldImage,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(backgroundImageUrl || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadProgress(0);

    if (file.size > 100 * 1024 * 1024) {
      setUploadError('O ficheiro é demasiado grande. Tamanho máximo: 100MB');
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Formato inválido. Use PNG, JPG, GIF ou WEBP');
      return;
    }

    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        setUploadProgress(progress);
      }
    };

    reader.onload = (event) => {
      if (previewUrl && onRemoveOldImage) {
        onRemoveOldImage();
      }

      setPreviewUrl(event.target?.result as string);
      onBackgroundImageChange(file);
      setUploadProgress(100);
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    if (onRemoveOldImage) {
      onRemoveOldImage();
    }
    setPreviewUrl(null);
    onBackgroundImageChange(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getGradientStyle = () => {
    return {
      backgroundImage: `linear-gradient(${gradientDirection}, ${gradientFrom}, ${gradientVia}, ${gradientTo})`
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Fundo do Hero Section</h3>
        <p className="text-sm text-gray-600 mb-6">
          Personalize o fundo da seção principal com um gradiente ou imagem
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={useBackgroundImage}
            onChange={(e) => onUseBackgroundImageChange(e.target.checked)}
            className="mt-1 w-5 h-5 text-yellow-400 border-gray-300 rounded focus:ring-yellow-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900 block mb-1">
              Usar imagem de fundo em vez de gradiente
            </span>
            <span className="text-xs text-gray-600">
              Ative esta opção para usar uma imagem personalizada (incluindo GIFs animados)
            </span>
          </div>
        </label>
      </div>

      {useBackgroundImage ? (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview do fundo"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                    title="Remover imagem"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-sm text-yellow-600 hover:text-yellow-700 font-medium py-2 border border-yellow-300 rounded-lg hover:bg-yellow-50 transition-colors"
                >
                  Alterar imagem
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="bg-gray-100 rounded-full p-6">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-lg transition-colors"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Selecionar Imagem ou GIF
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF ou WEBP (máx. 100MB)
                </p>
              </div>
            )}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 text-center mt-2">
                  A carregar... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{uploadError}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-2">Dicas:</p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>GIFs animados são totalmente suportados e reproduzidos automaticamente</li>
              <li>A imagem será esticada para cobrir toda a área sem distorção</li>
              <li>Recomenda-se usar imagens com dimensões de pelo menos 1920x600 pixels</li>
              <li>Um overlay semi-transparente será adicionado para manter o texto legível</li>
              <li>Ficheiros grandes podem demorar alguns segundos a carregar</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Palette className="h-4 w-4" />
              <span>Cor Inicial do Gradiente</span>
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={gradientFrom}
                onChange={(e) => onGradientFromChange(e.target.value)}
                className="h-12 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={gradientFrom}
                onChange={(e) => onGradientFromChange(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent font-mono text-sm"
                placeholder="#111827"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Palette className="h-4 w-4" />
              <span>Cor Intermédia do Gradiente</span>
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={gradientVia}
                onChange={(e) => onGradientViaChange(e.target.value)}
                className="h-12 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={gradientVia}
                onChange={(e) => onGradientViaChange(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent font-mono text-sm"
                placeholder="#1f2937"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Palette className="h-4 w-4" />
              <span>Cor Final do Gradiente</span>
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={gradientTo}
                onChange={(e) => onGradientToChange(e.target.value)}
                className="h-12 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={gradientTo}
                onChange={(e) => onGradientToChange(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent font-mono text-sm"
                placeholder="#92400e"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Direção do Gradiente
            </label>
            <select
              value={gradientDirection}
              onChange={(e) => onGradientDirectionChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              {gradientDirections.map((direction) => (
                <option key={direction.value} value={direction.value}>
                  {direction.label}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Pré-visualização do Gradiente</h4>
            <div
              className="w-full h-32 rounded-lg border border-gray-300"
              style={getGradientStyle()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroBackgroundEditor;
