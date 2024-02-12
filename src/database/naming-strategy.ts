import * as decamelize from 'decamelize';
import * as pluralize from 'pluralize';
import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

export class NamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  tableName(targetName: string, userSpecifiedName?: string): string {
    return userSpecifiedName || decamelize(pluralize(targetName));
  }

  columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[],
  ): string {
    const name = customName || propertyName;

    if (embeddedPrefixes.length) {
      return `${decamelize(embeddedPrefixes.join('_'))}_${decamelize(name)}`;
    }

    return decamelize(name);
  }

  relationName(propertyName: string): string {
    return decamelize(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return `${decamelize(relationName)}_${decamelize(referencedColumnName)}`;
  }

  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return `${pluralize.singular(tableName)}_${decamelize(
      columnName ? columnName : propertyName,
    )}`;
  }
}
