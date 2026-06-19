import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pokemon Monorepo API',
      version: '1.0.0',
      description: 'API pública para consultar, crear, editar y eliminar Pokémon y equipos. Datos sincronizados desde PokeAPI.',
      contact: { name: 'Pokemon Monorepo' },
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Local development' },
    ],
    components: {
      schemas: {
        Pokemon: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'MongoDB ID' },
            externalId: { type: 'string', description: 'ID único del Pokémon (1-1010 de PokeAPI, ≥100000 custom)' },
            title: { type: 'string', description: 'Nombre del Pokémon' },
            description: { type: 'string', description: 'Tipos separados por coma (e.g. "fire, flying")' },
            rawData: { type: 'object', description: 'Respuesta completa de PokeAPI' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          example: {
            _id: '665a1b2c3d4e5f6a7b8c9d0e',
            externalId: '6',
            title: 'charizard',
            description: 'fire, flying',
            rawData: { id: 6, name: 'charizard', height: 17, weight: 905, sprites: { other: { 'official-artwork': { front_default: 'https://...' } } } },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Pokemon' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        Team: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            pokemon: { type: 'array', items: { type: 'string' }, description: 'Array de externalIds' },
            pokemonData: { type: 'array', items: { $ref: '#/components/schemas/Pokemon' }, description: 'Solo en GET' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          example: {
            _id: '665a1b2c3d4e5f6a7b8c9d0f',
            name: 'My Fire Team',
            pokemon: ['6', '7', '8'],
            pokemonData: [{ externalId: '6', title: 'charizard', description: 'fire, flying' }],
          },
        },
        CreatePokemonInput: {
          type: 'object',
          required: ['title', 'types'],
          properties: {
            title: { type: 'string', maxLength: 40 },
            types: { type: 'array', items: { type: 'string' }, minItems: 1 },
            stats: {
              type: 'object',
              properties: {
                hp: { type: 'integer', minimum: 0, maximum: 255 },
                attack: { type: 'integer', minimum: 0, maximum: 255 },
                defense: { type: 'integer', minimum: 0, maximum: 255 },
                'special-attack': { type: 'integer', minimum: 0, maximum: 255 },
                'special-defense': { type: 'integer', minimum: 0, maximum: 255 },
                speed: { type: 'integer', minimum: 0, maximum: 255 },
              },
            },
            height: { type: 'integer', description: 'En decímetros' },
            weight: { type: 'integer', description: 'En hectogramos' },
            baseExperience: { type: 'integer' },
            abilities: { type: 'string', description: 'Comma-separated' },
            sprite: { type: 'string', format: 'uri' },
            shinySprite: { type: 'string', format: 'uri' },
          },
          example: {
            title: 'mypokemon',
            types: ['fire', 'flying'],
            stats: { hp: 78, attack: 84, defense: 78, 'special-attack': 109, 'special-defense': 85, speed: 100 },
            height: 17, weight: 905, baseExperience: 240,
            abilities: 'blaze, solar-power',
            sprite: 'https://example.com/sprite.png',
          },
        },
        CreateTeamInput: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Team name' },
            pokemon: { type: 'array', items: { type: 'string' }, maxItems: 6, description: 'Array de externalIds' },
          },
          example: { name: 'My Team', pokemon: ['6', '25', '150'] },
        },
        ErrorResponse: {
          type: 'object',
          properties: { message: { type: 'string' } },
          example: { message: 'Pokemon not found' },
        },
      },
    },
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, timestamp: { type: 'string' } } } } } } },
        },
      },
      '/api/pokemon': {
        get: {
          tags: ['Pokémon'],
          summary: 'Lista paginada de Pokémon',
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Buscar por nombre' },
            { name: 'type', in: 'query', schema: { type: 'string' }, description: 'Filtrar por tipo(s), separados por coma' },
            { name: 'ids', in: 'query', schema: { type: 'string' }, description: 'Filtrar por IDs específicos, separados por coma' },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 60, maximum: 200 } },
            { name: 'sort', in: 'query', schema: { type: 'string', enum: ['id', 'name'] }, description: 'Ordenar por # o nombre' },
          ],
          responses: { 200: { description: 'Lista paginada', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } } },
        },
        post: {
          tags: ['Pokémon'],
          summary: 'Crear Pokémon custom',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePokemonInput' } } } },
          responses: { 201: { description: 'Pokémon creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Pokemon' } } } }, 400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } },
        },
        delete: {
          tags: ['Pokémon'],
          summary: 'Eliminar TODOS los Pokémon',
          responses: { 200: { description: 'All data deleted' } },
        },
      },
      '/api/pokemon/random': {
        get: {
          tags: ['Pokémon'],
          summary: 'Obtener un Pokémon aleatorio',
          responses: { 200: { description: 'Pokémon aleatorio', content: { 'application/json': { schema: { $ref: '#/components/schemas/Pokemon' } } } }, 404: { description: 'No hay Pokémon disponibles' } },
        },
      },
      '/api/pokemon/{externalId}': {
        get: {
          tags: ['Pokémon'],
          summary: 'Obtener Pokémon por ID (o nombre)',
          parameters: [{ name: 'externalId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID numérico o nombre del Pokémon' }],
          responses: { 200: { description: 'Detalle del Pokémon con prevPokemon/nextPokemon', content: { 'application/json': { schema: { type: 'object', properties: { prevPokemon: { type: 'object' }, nextPokemon: { type: 'object' } }, allOf: [{ $ref: '#/components/schemas/Pokemon' }] } } } }, 404: { description: 'Pokemon not found' } },
        },
        put: {
          tags: ['Pokémon'],
          summary: 'Actualizar Pokémon (campos parciales)',
          parameters: [{ name: 'externalId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePokemonInput' } } } },
          responses: { 200: { description: 'Pokémon actualizado' }, 404: { description: 'Pokemon not found' } },
        },
        delete: {
          tags: ['Pokémon'],
          summary: 'Eliminar un Pokémon por ID',
          parameters: [{ name: 'externalId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Pokemon deleted' }, 404: { description: 'Pokemon not found' } },
        },
      },
      '/api/pokemon/{externalId}/species': {
        get: {
          tags: ['Pokémon'],
          summary: 'Datos de especie desde PokeAPI',
          parameters: [{ name: 'externalId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Species data from PokeAPI' }, 404: { description: 'Species data not available' } },
        },
      },
      '/api/pokemon/{externalId}/evolution': {
        get: {
          tags: ['Pokémon'],
          summary: 'Cadena evolutiva desde PokeAPI',
          parameters: [{ name: 'externalId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Evolution chain from PokeAPI' }, 404: { description: 'Evolution chain not available' } },
        },
      },
      '/api/pokemon/sync': {
        post: {
          tags: ['Pokémon'],
          summary: 'Sincronizar datos desde PokeAPI',
          responses: { 200: { description: 'Data synchronized', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, count: { type: 'integer' } } } } } } },
        },
      },
      '/api/teams': {
        get: {
          tags: ['Teams'],
          summary: 'Listar todos los equipos con datos poblados',
          responses: { 200: { description: 'Lista de equipos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Team' } } } } } },
        },
        post: {
          tags: ['Teams'],
          summary: 'Crear un equipo',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTeamInput' } } } },
          responses: { 201: { description: 'Team created' }, 400: { description: 'Team cannot have more than 6 Pokémon' } },
        },
      },
      '/api/teams/{id}': {
        get: {
          tags: ['Teams'],
          summary: 'Obtener equipo por ID con pokemonData poblados',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Team detail', content: { 'application/json': { schema: { $ref: '#/components/schemas/Team' } } } }, 404: { description: 'Team not found' } },
        },
        put: {
          tags: ['Teams'],
          summary: 'Actualizar nombre y/o roster del equipo',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTeamInput' } } } },
          responses: { 200: { description: 'Team updated' }, 404: { description: 'Team not found' } },
        },
        delete: {
          tags: ['Teams'],
          summary: 'Eliminar equipo',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Team deleted' }, 404: { description: 'Team not found' } },
        },
      },
    },
  },
  apis: [],
};

export default swaggerJsdoc(options);
