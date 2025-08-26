<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Promag::index');
$routes->get('/promag', 'Promag::index');
$routes->get('/mloc', 'MLoc::index');
$routes->get('/vtrip', 'VTrip::index'); // yang sudah kamu punya
$routes->get('contract', 'Contract::index');
     // opsional: jadikan default

 // opsional: jadikan default
