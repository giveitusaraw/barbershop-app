import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Scissors } from 'lucide-react';

interface LogoSectionEditorProps {
  logoText: string;
  logoImageUrl?: string;
  useCustomLogo: boolean;
  onLogoTextChange: (value: string) => void;
  onLogoImageChange: (file: File | null) => void;
  onUseCustomLogoChange: (value: boolean) => void;
  onRemoveOldImage?: () => void;
}

const LogoSectionEditor: React.FC<LogoSectionEditorProps> = ({
  logoText,
  logoImageUrl,
  useCustomLogo,
  onLogoTextChange,
  onLogoImageChange,
  onUseCustomLogoChange,
  onRemoveOldImage,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(logoImageUrl || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('O ficheiro é demasiado grande. Tamanho máximo: 5MB');
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Formato inválido. Use PNG, JPG ou SVG');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (img.width > 80 || img.height > 80) {
          setUploadError('Dimensões demasiado grandes. Máximo: 80x80 pixels');
          return;
        }

        if (previewUrl && onRemoveOldImage) {
          onRemoveOldImage();
        }

        setPreviewUrl(event.target?.result as string);
        onLogoImageChange(file);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    if (onRemoveOldImage) {
      onRemoveOldImage();
    }
    setPreviewUrl(null);
    onLogoImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Configuração do Logo</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure o logótipo que aparece no canto superior esquerdo do cabeçalho
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Texto do Logo
        </label>
        <input
          type="text"
          value={logoText}
          onChange={(e) => onLogoTextChange(e.target.value.slice(0, 30))}
          maxLength={30}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          placeholder="Ex: Barber"
        />
        <p className="text-xs text-gray-500 mt-1">
          Máximo de 30 caracteres ({logoText.length}/30)
        </p>
      </div>

      <div>
        <label className="flex items-center space-x-3 mb-4">
          <input
            type="checkbox"
            checked={useCustomLogo}
            onChange={(e) => onUseCustomLogoChange(e.target.checked)}
            className="w-5 h-5 text-yellow-400 border-gray-300 rounded focus:ring-yellow-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Usar imagem personalizada em vez do ícone de tesoura
          </span>
        </label>

        {useCustomLogo && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {previewUrl ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview do logo"
                        className="w-24 h-24 object-contain rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Remover imagem"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Alterar imagem
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="bg-gray-100 rounded-full p-4">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-lg transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Imagem
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG ou SVG (máx. 5MB, recomendado: 80x80px)
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
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
                <li>Use uma imagem quadrada para melhores resultados</li>
                <li>Dimensões recomendadas: 80x80 pixels</li>
                <li>A imagem será redimensionada automaticamente se necessário</li>
                <li>Use fundo transparente (PNG) para melhor integração</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Pré-visualização</h4>
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            {useCustomLogo && previewUrl ? (
              <img
                src={previewUrl}
                alt="Logo preview"
                className="w-20 h-20 object-contain"
              />
            ) : (
              <Scissors className="h-6 w-6 text-gray-900" />
            )}
            {logoText && <h1 className="text-2xl font-bold text-gray-900">{logoText}</h1>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoSectionEditor;
