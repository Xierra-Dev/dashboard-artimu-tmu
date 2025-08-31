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

$routes->get('api/vtrip', 'VTrip::json');   // untuk v_trip.js
$routes->get('api/mloc',  'MLoc::json');    // kalau kamu juga mau m_loc.js