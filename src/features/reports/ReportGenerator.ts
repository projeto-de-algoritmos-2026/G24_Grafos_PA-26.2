import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Building, Floor, SimulationIntensity, SimulationResult } from '@/types';
import { formatDateTime, formatSeconds } from '@/utils/format';

const intensityLabels: Record<SimulationIntensity, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export const generateSimulationPdf = async (target: HTMLElement, result: SimulationResult, building: Building, floor: Floor): Promise<void> => {
  const canvas = await html2canvas(target, { backgroundColor: '#ffffff', scale: 2 });
  const image = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const width = 190;
  const height = (canvas.height * width) / canvas.width;

  pdf.setFontSize(18);
  pdf.text('ExitPath - Relatório de Simulação', 10, 14);
  pdf.setFontSize(10);
  pdf.text(`Edifício: ${building.name}`, 10, 24);
  pdf.text(`Andar: ${floor.name}`, 10, 30);
  pdf.text(`Data: ${formatDateTime(result.executedAt)}`, 10, 36);
  pdf.text(`Intensidade: ${intensityLabels[result.config.intensity]}`, 10, 42);
  pdf.text(`Evacuados: ${result.evacuatedPeople}/${result.totalPeople}`, 10, 48);
  pdf.text(`Tempo estimado: ${formatSeconds(result.estimatedTimeSeconds)}`, 10, 54);
  pdf.text(`Cobertura: ${result.coveragePercentage}%`, 10, 60);
  pdf.addImage(image, 'PNG', 10, 68, width, Math.min(height, 120));
  pdf.setFontSize(12);
  pdf.text('Áreas inacessíveis', 10, 196);
  pdf.setFontSize(9);
  result.inaccessibleEnvironmentIds.slice(0, 18).forEach((id, index) => {
    const env = floor.environments.find((item) => item.id === id);
    pdf.text(`- ${env?.name ?? id}`, 12, 204 + index * 5);
  });
  pdf.save(`exitpath-${building.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};
