import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: string = 'short'): string {
    if (!value) return '';

    const date = new Date(value);
    if (isNaN(date.getTime())) return '';

    const options: Intl.DateTimeFormatOptions = {};

    switch (format) {
      case 'short':
        options.day = '2-digit';
        options.month = '2-digit';
        options.year = 'numeric';
        break;
      case 'long':
        options.day = 'numeric';
        options.month = 'long';
        options.year = 'numeric';
        break;
      case 'time':
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
      case 'datetime':
        options.day = '2-digit';
        options.month = '2-digit';
        options.year = 'numeric';
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
      default:
        options.day = '2-digit';
        options.month = '2-digit';
        options.year = 'numeric';
    }

    return date.toLocaleDateString('es-ES', options);
  }
}
